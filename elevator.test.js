const { Elevator, State } = require('./elevator');

jest.mock('worker_threads', () => {
    return {
      parentPort: {
        on: jest.fn(),
        postMessage: jest.fn(),
      },
    };
  });

test('Elevator should set the requested floor', () => {
    const elevator = new Elevator();
    elevator.setFloor(5);
    expect(elevator.getFloor()).toBe(5);
});

test('Elevator should set the correct state', () => {
    const elevator = new Elevator();
    elevator.setState(State.Stopped);
    expect(elevator.state).toBe(State.Stopped);
});

test('Elevator should return the next upward floor when direction is Up', () => {
    const elevator = new Elevator(0, 0, State.Stopped);
    elevator.upwardList = [2, 5, 8];
    elevator.downwardList = [];
    elevator.direction = 1; // Direction.Up
    const nextFloor = elevator.getNextFloor();
    expect(nextFloor).toBe(2);
});

test('Elevator should return the next downward floor when direction is Down', () => {
    const elevator = new Elevator(10, 0, State.Stopped);
    elevator.upwardList = [];
    elevator.downwardList = [8, 5, 2];
    elevator.direction = 0; // Direction.Down
    const nextFloor = elevator.getNextFloor();
    expect(nextFloor).toBe(8);
});

test('Elevator should switch direction to Down if no upward floors are left', () => {
    const elevator = new Elevator(10, 0, State.Stopped);
    elevator.upwardList = [];
    elevator.downwardList = [8, 5, 2];
    elevator.direction = 1; // Direction.Up
    const nextFloor = elevator.getNextFloor();
    expect(nextFloor).toBe(8);
    expect(elevator.direction).toBe(0); // Direction.Down
});

test('Elevator should switch direction to Up if no downward floors are left', () => {
    const elevator = new Elevator(0, 0, State.Stopped);
    elevator.upwardList = [2, 5, 8];
    elevator.downwardList = [];
    elevator.direction = 0; // Direction.Down
    const nextFloor = elevator.getNextFloor();
    expect(nextFloor).toBe(2);
    expect(elevator.direction).toBe(1); // Direction.Up
});

test('Elevator should return null if there are no floors in either direction', () => {
    const elevator = new Elevator(0, 0, State.Stopped);
    elevator.upwardList = [];
    elevator.downwardList = [];
    elevator.direction = 1; // Direction.Up
    const nextFloor = elevator.getNextFloor();
    expect(nextFloor).toBeNull();
});

test('addToWaitList should add a floor to the upward list and sort it', () => {
    const elevator = new Elevator(0, 0, State.Stopped);
    elevator.addToWaitList(5, 1); // Direction.Up
    elevator.addToWaitList(2, 1); // Direction.Up
    elevator.addToWaitList(8, 1); // Direction.Up
    expect(elevator.upwardList).toEqual([0, 2, 5, 8]);
});

test('addToWaitList should not add duplicate floors to the upward list', () => {
    const elevator = new Elevator(0, 0, State.Stopped);
    elevator.addToWaitList(5, 1); // Direction.Up
    elevator.addToWaitList(5, 1); // Direction.Up
    expect(elevator.upwardList).toEqual([0, 5]);
});

test('addToWaitList should add a floor to the downward list and sort it in descending order', () => {
    const elevator = new Elevator(10, 0, State.Stopped);
    elevator.addToWaitList(8, 0); // Direction.Down
    elevator.addToWaitList(5, 0); // Direction.Down
    elevator.addToWaitList(2, 0); // Direction.Down
    expect(elevator.downwardList).toEqual([10, 8, 5, 2]);
});

test('addToWaitList should not add duplicate floors to the downward list', () => {
    const elevator = new Elevator(10, 0, State.Stopped);
    elevator.addToWaitList(8, 0); // Direction.Down
    elevator.addToWaitList(8, 0); // Direction.Down
    expect(elevator.downwardList).toEqual([10, 8]);
});

test('addToWaitList should not modify lists if an invalid direction is provided', () => {
    const elevator = new Elevator(0, 0, State.Stopped);
    elevator.addToWaitList(5, 2); // Invalid direction
    expect(elevator.upwardList).toEqual([0]);
    expect(elevator.downwardList).toEqual([]);
});

test('userSelect should add destinations to the appropriate lists and sort them', async () => {
    const elevator = new Elevator(0, 0, State.Stopped);
    await elevator.userSelect([5, 2, 8]); // All upward destinations
    expect(elevator.upwardList).toEqual([0, 2, 5, 8]);
    expect(elevator.downwardList).toEqual([]);
});

test('userSelect should handle mixed upward and downward destinations', async () => {
    const elevator = new Elevator(5, 0, State.Stopped);
    await elevator.userSelect([2, 8, 3]); // Mixed destinations
    expect(elevator.upwardList).toEqual([8]);
    expect(elevator.downwardList).toEqual([5, 3, 2]);
});

test('userSelect should not add duplicate destinations', async () => {
    const elevator = new Elevator(0, 0, State.Stopped);
    await elevator.userSelect([5, 5, 2, 2]); // Duplicate destinations
    expect(elevator.upwardList).toEqual([0, 2, 5]);
    expect(elevator.downwardList).toEqual([]);
});

test('userSelect should handle destinations at the current floor', async () => {
    const elevator = new Elevator(5, 0, State.Stopped);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await elevator.userSelect([5]); // Destination at the current floor
    expect(consoleSpy).toHaveBeenCalledWith('Elevator open at Floor: 5. User can exit now.');
    expect(elevator.upwardList).toEqual([]);
    expect(elevator.downwardList).toEqual([5]);
    consoleSpy.mockRestore();
});

test('userSelect should add destinations to the wait list if elevator cannot be used', async () => {
    const elevator = new Elevator(0, 10, State.Running); // Elevator at max occupancy
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await elevator.userSelect([5]);
    expect(consoleSpy).toHaveBeenCalledWith(
        'Elevator full or error. Please wait. You are at: 5, elevator at: 0'
    );
    expect(elevator.upwardList).toEqual([0, 5]);
    consoleSpy.mockRestore();
});