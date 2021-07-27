package com.yattoni.awslambdacoldstartexperiment;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LambdaHandlerTest {
    @Test
    void passingTest() {
        new LambdaHandler();
        assertEquals(4, 2+2);
    }
}