import '@aws-cdk/assert/jest';
import { App } from 'monocdk';
import { AwsLambdaColdStartExperiment } from '../src/main';

test('Snapshot', () => {
  const app = new App();
  const stack = new AwsLambdaColdStartExperiment(app, 'test');

  expect(stack).not.toHaveResource('AWS::S3::Bucket');
  expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
});