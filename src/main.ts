import { env } from 'process';
import { App, Construct, DockerImage, Duration, Stack, StackProps } from 'monocdk';
import { Code, Function, Runtime } from 'monocdk/aws-lambda';
import { SqsEventSource } from 'monocdk/aws-lambda-event-sources';
import { GoFunction } from 'monocdk/aws-lambda-go';
import { PythonFunction } from 'monocdk/aws-lambda-python';
import { Topic } from 'monocdk/aws-sns';
import { SqsSubscription } from 'monocdk/aws-sns-subscriptions';
import { Queue } from 'monocdk/aws-sqs';

export class AwsLambdaColdStartExperiment extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const goTopic = new Topic(this, 'GoTopic');
    const goQueue = new Queue(this, 'GoQueue');
    goTopic.addSubscription(new SqsSubscription(goQueue));

    const pythonTopic = new Topic(this, 'PythonTopic');
    const pythonQueue = new Queue(this, 'PythonQueue');
    pythonTopic.addSubscription(new SqsSubscription(pythonQueue));

    const javaTopic = new Topic(this, 'JavaTopic');
    const javaQueue = new Queue(this, 'JavaQueue');
    javaTopic.addSubscription(new SqsSubscription(javaQueue));

    const goFunction = new GoFunction(this, 'GoFunction', {
      entry: 'lambdas/golang',
      environment: {
        TARGET_TOPIC: pythonTopic.topicArn,
      },
    });
    pythonTopic.grantPublish(goFunction);

    const pythonFunction = new PythonFunction(this, 'PythonFunction', {
      entry: 'lambdas/python',
      environment: {
        TARGET_TOPIC: javaTopic.topicArn,
      },
    });
    javaTopic.grantPublish(pythonFunction);

    const javaFunction = new Function(this, 'JavaFunction', {
      runtime: Runtime.JAVA_11,
      // code: Code.fromAsset('lambdas/java/lib/build/libs/lib-0.1.0-all.jar'),
      code: Code.fromAsset('lambdas/java', {
        bundling: {
          command: [
            '/bin/sh', '-c', [
              'gradle clean shadowJar --console verbose',
              'cp /asset-input/lib/build/libs/lib-0.1.0-all.jar /asset-output/',
              'ls /asset-output/',
            ].join(' && '),
          ],
          // https://github.com/keeganwitt/docker-gradle
          // https://hub.docker.com/_/gradle/
          image: DockerImage.fromRegistry('gradle:jdk11'),
          volumes: [
            {
              hostPath: `/Users/${env.USER}/.gradle/`,
              containerPath: '/home/gradle/.gradle.',
            },
          ],
          user: 'gradle',
        },
      }),
      handler: 'com.yattoni.awslambdacoldstartexperiment.LambdaHandler',
      environment: {
        TARGET_TOPIC: goTopic.topicArn,
      },
      timeout: Duration.seconds(10),
      // Note: The other two lambdas default to 128 MB and this one needs 1024 MB
      // in order to not timeout :/
      memorySize: 1024,
    });
    goTopic.grantPublish(javaFunction);

    // If batch size is 0 and window 0 seconds then this will invoke as fast as it can
    goFunction.addEventSource(new SqsEventSource(goQueue, {
      batchSize: 10,
      maxBatchingWindow: Duration.seconds(10),
    }));
    pythonFunction.addEventSource(new SqsEventSource(pythonQueue, {
      batchSize: 10,
      // maxBatchingWindow: Duration.seconds(10),
    }));
    javaFunction.addEventSource(new SqsEventSource(javaQueue, {
      batchSize: 10,
      maxBatchingWindow: Duration.seconds(10),
    }));
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new AwsLambdaColdStartExperiment(app, 'aws-lambda-cold-start-experiment', { env: devEnv });

app.synth();
