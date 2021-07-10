import { App, Construct, Duration, Stack, StackProps } from 'monocdk';
import { SqsEventSource } from 'monocdk/lib/aws-lambda-event-sources';
import { GoFunction } from 'monocdk/lib/aws-lambda-go';
import { PythonFunction } from 'monocdk/lib/aws-lambda-python';
import { Topic } from 'monocdk/lib/aws-sns';
import { SqsSubscription } from 'monocdk/lib/aws-sns-subscriptions';
import { Queue } from 'monocdk/lib/aws-sqs';

export class AwsLambdaColdStartExperiment extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const goTopic = new Topic(this, 'GoTopic');
    const goQueue = new Queue(this, 'GoQueue');
    goTopic.addSubscription(new SqsSubscription(goQueue));

    const pythonTopic = new Topic(this, 'PythonTopic');
    const pythonQueue = new Queue(this, 'PythonQueue');
    pythonTopic.addSubscription(new SqsSubscription(pythonQueue));

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
        TARGET_TOPIC: goTopic.topicArn,
      },
    });
    goTopic.grantPublish(pythonFunction);

    goFunction.addEventSource(new SqsEventSource(goQueue, {
      batchSize: 10,
      maxBatchingWindow: Duration.seconds(10),
    }));
    pythonFunction.addEventSource(new SqsEventSource(pythonQueue, {
      batchSize: 10,
      // maxBatchingWindow: Duration.seconds(10),
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
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();