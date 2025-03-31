import { parentPort } from 'worker_threads';

const State = {
    Error: -1,
    Stopped: 0,
    Running: 1 
};

const Direction = {
    Down: 0,
    Up: 1
};

const MAX_OCCUPANCY = 10; // Currently unused

export class Elevator {
    constructor(floor, occupancy, state) {
        this.floor = floor;
        this.occupancy = occupancy;
        this.state = state;
        this.upwardList = [0];
        this.downwardList = [];
        this.direction = Direction.Up; // Initial state
    }

    onDestination(floor, direction) {
        this.setFloor(floor);
        console.log(`Elevator open at Floor: ${this.floor}`);
        parentPort.postMessage({event: 'doorOpen', data: this});
        this.updateList(direction);
    }

    getFloor() {
        return this.floor;
    }

    setFloor(floor) {
        this.floor = floor;
    }

    setState(state) {
        this.state = state;
    }

    resetToBaseLevel() {
        this.upwardList = [0];
        this.downwardList = [0];
    }

    canUse() {
        return this.state !== State.Error && this.occupancy < MAX_OCCUPANCY;
    }

    openRequest(userFloor) {
        let direction;
        let diff = userFloor - this.floor;
         if (diff > 0) {
            direction = Direction.Up;
        } else {
            direction = Direction.Down;
        }

        if (!this.canUse()) {
            console.log(`Elevator full or error. Please wait. You are at: ${userFloor} , elevator at: ${this.floor}`);
            this.addToWaitList(userFloor, direction);
            return;
        }

        if (userFloor !== this.floor) {
            console.log(`Elevator in use. Please wait. You are at: ${userFloor} , elevator at: ${this.floor}`);
            this.addToWaitList(userFloor, direction);
            return;
        } 
    }

    async userSelect(destinations) {     
        for (let i = 0; i < destinations.length; i++) {
            const userFloor = destinations[i];
            let direction;
            let diff = this.floor - userFloor;
            if (diff === 0) {
            console.log(`Elevator open at Floor: ${this.floor}. User can exit now.`);
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            } else if (diff > 0) {
            direction = Direction.Down;
            } else {
            direction = Direction.Up;
            }
        
            if (!this.canUse()) {
            console.log(`Elevator full or error. Please wait. You are at: ${userFloor}, elevator at: ${this.floor}`);
            this.addToWaitList(userFloor, direction);
            continue;
            }
        
            if (userFloor !== this.floor) {
            console.log(`Elevator in use. User destination added: ${userFloor}, elevator at: ${this.floor}`);
            this.addToWaitList(userFloor, direction);
            continue;
            }
        }
    }

    addToWaitList(floor, direction) {
        if (direction === Direction.Up) {
            if (this.upwardList.find((f) => f === floor) === undefined) {
                this.upwardList.push(floor);
                this.upwardList.sort((a, b) => a - b); // Sort the list to maintain order
            }
        } else if (direction === Direction.Down) {
            if (this.downwardList.find((f) => f === floor) === undefined) {
                this.downwardList.push(floor);
                this.downwardList.sort((a, b) => b - a); // Sort the list in descending order for downward direction
            }
        }
    }

    updateList(direction) {
        if (direction === Direction.Up) {
            this.upwardList.shift();
        } else if (direction === Direction.Down) {
            this.downwardList.shift();
        }
    }

    getNextFloor() {
        let nextFloor = null;
        if (this.direction === Direction.Up){
            if(this.upwardList.length > 0) {
                nextFloor = this.upwardList[0];
            }
            else if (this.downwardList.length > 0) {
                nextFloor = this.downwardList[0];
                this.direction = Direction.Down; // Change direction if there are no more upward floors
            }
        } else if (this.direction === Direction.Down){           
            if(this.downwardList.length > 0) {
                nextFloor = this.downwardList[0];
            }
            else if (this.upwardList.length > 0) {
                nextFloor = this.upwardList[0];
                this.direction = Direction.Up; // Change direction if there are no more upward floors
            }
        }
        return nextFloor;
    }

    async runElevator(){
        while (this.state === State.Running) {          
            if (this.upwardList.length > 0 || this.downwardList.length > 0) {
              let nextFloor = this.getNextFloor();
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1000ms 
              this.onDestination(nextFloor, this.direction);
            } else {
              // If no messages, wait a bit before looping again
              // this prevents the loop from consuming too much CPU
              this.setState(State.Stopped); // Stop the elevator if there are no more floors to go to
              await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
              console.log('No more floors to go. Stopping elevator.');
            }
            parentPort.postMessage({event: 'status', data: this});
        }       
    }
}

const elevator = new Elevator(0, 0, State.Stopped);

parentPort.on('message', async (event) => {
    const { data } = event;
    switch (data.type) {
        case 'userSelect': {
            console.log(`User input received at Floor: ${data.userFloor} to Destinations: ${data.inputs}`);
            await elevator.userSelect(data.inputs);
            if (elevator.state === State.Stopped) {
                elevator.setState(State.Running); // Change state to Running if we have a valid request
                await elevator.runElevator(); // Run elevator if stopped
             } 
            break;
        }
        case 'openRequest': {
            console.log(`User requested elevator at Floor: ${data.userFloor}`);
            // Check if the elevator is already at the requested floor
            if (data.userFloor === elevator.floor) {
                console.log(`Elevator open at Floor: ${elevator.floor}.`);
                parentPort.postMessage({event: 'doorOpen', data: elevator});
                return;
            }
            elevator.openRequest(data.userFloor);
            if (elevator.state === State.Stopped) {
                elevator.setState(State.Running); // Change state to Running if we have a valid request
                await elevator.runElevator(); // Run elevator if stopped
             } 
            break;
        }
        case 'onStop': {
            elevator.setState(State.Stopped);
            break;
        }
        
        default: {
            console.log('Received error message from controller.');
            elevator.setState(State.Error);
        }
    }
});