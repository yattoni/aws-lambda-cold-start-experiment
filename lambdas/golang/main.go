package main

import (
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sns"
)

func handle(sqsEvent events.SQSEvent) error {
	for _, message := range sqsEvent.Records {
		fmt.Printf("The message %s for event source %s = %s \n", message.MessageId, message.EventSource, message.Body)
	}
	sess := session.Must(session.NewSession())
	snsClient := sns.New(sess)

	message := "Hello python lambda!"
	topicArn := os.Getenv("TARGET_TOPIC")

	publishOutput, _ := snsClient.Publish(&sns.PublishInput{
		Message:  &message,
		TopicArn: &topicArn,
	})

	fmt.Printf("Sent message with ID %s\n", *publishOutput.MessageId)
	return nil
}

func main() {
	lambda.Start(handle)
}
