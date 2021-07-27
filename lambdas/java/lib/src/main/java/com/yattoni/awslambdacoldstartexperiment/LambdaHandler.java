package com.yattoni.awslambdacoldstartexperiment;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.amazonaws.services.sns.AmazonSNS;
import com.amazonaws.services.sns.AmazonSNSClientBuilder;
import com.amazonaws.services.sns.model.PublishResult;

public class LambdaHandler implements RequestHandler<SQSEvent, Void> {
    @Override
    public Void handleRequest(SQSEvent input, Context context) {
        for (SQSEvent.SQSMessage sqsMessage : input.getRecords()) {
            System.out.println(String.format("The message %s for event source %s = %s",
                    sqsMessage.getMessageId(), sqsMessage.getEventSource(), sqsMessage.getBody()));
        }

        final AmazonSNS snsClient = AmazonSNSClientBuilder.defaultClient();

        final String message = "Hello from java lambda!";
        final String topicArn = System.getenv("TARGET_TOPIC");

        System.out.println(String.format("Sending message to %s", topicArn));

        final PublishResult publishResult = snsClient.publish(topicArn, message);

        System.out.println(String.format("Sent message with ID %s", publishResult.getMessageId()));

        return null;
    }
}
