import { Worker } from 'worker_threads';

// For the simulation, we are using a map but in reality expect duplicate inputs (same floor requests)
const userInputs = new Map();
userInputs.set(0, [4, 5, 3, 7, 9]);
userInputs.set(2, [1, 5, 5, 7, 9]);
userInputs.set(5, [3, 7, 9]);
userInputs.set(3, [6, 5, 3, 4, 9]);
userInputs.set(8, [9, 5, 3, 7, 9]);
userInputs.set(4, [4, 2, 8, 6]);
userInputs.set(1, [3]);
userInputs.set(7, [1, 5, 3, 7, 9]);

const inputTracker = new Set();

function getElevatoreState(state){
    switch (state) {
        case -1:
            return 'Error';
        case 0:
            return 'Stopped';
        case 1:
            return 'Running';
        default:
            return 'Unknown State';
    }
}

async function run(){
    console.log('Starting elevator simulation...');
    const worker = new Worker('./elevator.js');
    Array.from(userInputs.keys()).forEach(async input => {
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 1000));
        console.log(`===> User inputs for floor ${input}: ${userInputs.get(input).join(', ')}`);
        worker.postMessage({ data: {type: 'openRequest', userFloor: input}});
    });
    
    worker.on('message', async (event) => {
        const { event: eventType, data: elevator } = event;
        if (eventType === 'doorOpen') {
            console.log(`[[< --- >]] Door opened at floor ${elevator.floor}. Please exit/enter the elevator and set destinations.`);
            // Simulate door open time
            await new Promise(resolve => setTimeout(resolve, 200)); // 2/10 seconds for door open
            console.log(`Door closed at floor ${elevator.floor}`);
            if (elevator.floor !== null && userInputs.has(elevator.floor)){
                if (!inputTracker.has(elevator.floor)){
                    worker.postMessage({ 
                        data: {type: 'userSelect', 
                        userFloor: elevator.floor,
                        inputs: userInputs.get(elevator.floor)}});
                    inputTracker.add(elevator.floor); // prevent reprocessing the inputs upon door open
                }
            }
        } else if (eventType === 'status') {
            console.log(`[[]] Current Elevator Status: ${getElevatoreState(elevator.state)}, Floor: ${elevator.floor}, Direction: ${elevator.direction === 0 ? 'down' : 'up'}, 
                Upward List: ${elevator.upwardList}, Downward List: ${elevator.downwardList}`);
        }
    });
    worker.on('error', (error) => {
        console.error('Worker error:', error);
    });
    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
        }
    });
}

await run();