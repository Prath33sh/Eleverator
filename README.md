# Eleverator - An elevator simulation in javascript.

## Working principle

It uses the javascript concept of Workers to process the elevator logic while keeping the main thread open to accept new inputs or publishing status messages.
There is also a continuous message loop that sends events back and forth between the main thread and the workers. The messages are transferred using the parentport and worker message handlers.
In this simplified example there is only a single worker but it can be extended to multiple and additional load balancing code can be added.
For the sake of simulation there is map that keeps track of the floor requests and a few user destination inputs at each floor. Also this initial version does not take into account the user inputs of pressing up/down buttons. 
It is deduced from the user input. The initial version also diregards capacity.

### Steps involved
1. The main thread iterates over the list of (test)inputs and posts a message to the worker to simulate a user request for the elevator.
2. If the elevator is already at that floor the user can enter and set the destinations right away. Otherwise the worker notifies when it arrives at that floor.
3. Once the event to enter the destinations is received the main thread gets the value portion of the maps to enter the destinatio floors.
4. The input is sorted according to the direction of the elevator and duplicates are eliminated.
5. The processing loop continues until there are no more floors to serve.

### Inputs
This elevator waits for user requests at any of the floors that it supports. There are 2 kinds of inputs:
**User open request** - This is when users request the elevator to stop any given floor so that they can get in and enter their destination.
**User destination input** - This is what users wiil enter once they are inside the elevator.

### Elevator States
The elevator has the following states:
    Error: Error state indicating an internal issue. It can also mimic the real life situation when it is having a hardware/power issue.
    Stopped: Waiting for user inputs.
    Running: Actively seving the floors.

### Elevator Actions
The elevator has the following actions that it performs:
    Stopped - When no floors are added to the desitantion list.
    Running - When it actively on its way to any of the destinations.
    DoorOpened - This is when it has reached a destination or already at a user requested floor.

## Main components

### main.js

This is the controller or entry point of the simulator. While in a real world example (or a UI) we should be expecting actual user inputs for the ease of verification we use a map of inputs.
A bunch of sample inputs are given. This file is also responsible for the creation of a worker and passing of user inputs initially to simpulate elevator requests and also for entering user destination requests.

### elevator.js

This is the worker thread. It listens for various user inputs and also posts messages back to the main thread for the following:
1. Status messages to keep track of the elevator status at any given point.
2. Message to indicate tha the door is open so that user nputs can be added.

## Future enhancements
1. (More)Unit tests.
2. Up/Down arrow support to mimic real life elevators.
3. Multiple workers and advanced synchronization for efficient elevator system.
4. A UI based simulator to demonstrate the actual workflow.

## Tests
Tests are based on Jest.
To run tests
```
npm run tests
```

