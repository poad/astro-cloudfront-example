import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import { compileBundles } from './process/setup';
import * as deployment from 'aws-cdk-lib/aws-s3-deployment';

export interface Config extends cdk.StackProps {
  bucketName: string;
  cloudfront: {
    comment: string;
    originAccessControl: {
      functionConfig: {
        name: string;
        arn?: string;
      };
      name: string;
    };
  };
}

interface CloudfrontCdnTemplateStackProps extends Config {
  environment?: string;
}

function websiteIndexPageForwardFunctionResolver(stack: cdk.Stack, functionConfig: {
  name: string;
  arn?: string;
}, functionName: string) {
  if (functionConfig.arn) {
    return cloudfront.Function.fromFunctionAttributes(
      stack,
      'WebsiteIndexPageForwardFunction',
      {
        functionName,
        functionArn: functionConfig.arn,
      },
    )
  }
  return new cloudfront.Function(stack, 'WebsiteIndexPageForwardFunction', {
    functionName,
    code: cloudfront.FunctionCode.fromFile({
      filePath: 'function/index.js',
    }),
    runtime: cloudfront.FunctionRuntime.JS_2_0,
  });
}

export class CloudfrontCdnTemplateStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: CloudfrontCdnTemplateStackProps,
  ) {
    super(scope, id, props);

    const {
      bucketName,
      environment,
      cloudfront: { comment, originAccessControl },
    } = props;

    const s3bucket = new s3.Bucket(this, 'S3Bucket', {
      bucketName,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      accessControl: s3.BucketAccessControl.PRIVATE,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // CloudFront Functionリソースの定義
    const { functionConfig } = originAccessControl;
    compileBundles();

    const functionName = environment ? `${environment}-${functionConfig.name}` : functionConfig.name;
    const websiteIndexPageForwardFunction = websiteIndexPageForwardFunctionResolver(this, functionConfig, functionName);
    const functionAssociations = [
      {
        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        function: websiteIndexPageForwardFunction,
      },
    ];

    const deployRole = new iam.Role(this, 'DeployWebsiteRole', {
      roleName: 'astro-cloudfront-example-deploy-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        's3-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:*'],
              resources: [`${s3bucket.bucketArn}/`, `${s3bucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });

    new deployment.BucketDeployment(this, 'DeployWebsite', {
      sources: [deployment.Source.asset(`${process.cwd()}/../app/dist`)],
      destinationBucket: s3bucket,
      destinationKeyPrefix: '/',
      exclude: ['.DS_Store', '*/.DS_Store'],
      prune: true,
      retainOnDelete: false,
      role: deployRole,
    });

    const oac = new cloudfront.S3OriginAccessControl(this, 'OriginAccessControl', {
      originAccessControlName: originAccessControl!.functionConfig.name,
      signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
    });

    const cf = new cloudfront.Distribution(this, 'CloudFront', {
      comment,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(s3bucket, {
          originAccessControl: oac,
        }),
        compress: true,
        functionAssociations,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // minTtl: cdk.Duration.seconds(0),
        // maxTtl: cdk.Duration.seconds(86400),
        // defaultTtl: cdk.Duration.seconds(3600),
      },
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });
    s3bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipalReadOnly',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [`${s3bucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${cf.distributionId}`,
          },
        },
      }),
    );

    new cdk.CfnOutput(this, 'AccessURLOutput', {
      value: `https://${cf.distributionDomainName}`,
    });
  }
}
