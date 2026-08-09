import { Task, FogNode, TerminalDevice, SchedulingSolution } from '../types';
import { calculateObjectiveFunction, calculateTotalDelay, calculateEnergyConsumption } from '../math';

export function fcfsSchedule(
  tasks: Task[],
  fogNodes: FogNode[],
  devices: TerminalDevice[]
): SchedulingSolution {
  const allocations = new Map<string, string>();
  const nodeAvailableTimes = new Map<string, number>();
  
  fogNodes.forEach(f => nodeAvailableTimes.set(f.id, 0));

  for (const task of tasks) {
    let earliestNode = fogNodes[0];
    let earliestTime = Infinity;

    for (const fogNode of fogNodes) {
      const availableTime = nodeAvailableTimes.get(fogNode.id) || 0;
      if (availableTime < earliestTime) {
        earliestTime = availableTime;
        earliestNode = fogNode;
      }
    }

    allocations.set(task.id, earliestNode.id);
    
    const delay = calculateTotalDelay(task, earliestNode);
    nodeAvailableTimes.set(earliestNode.id, earliestTime + delay);
  }

  const result = calculateObjectiveFunction(allocations, tasks, fogNodes, devices);

  let successfulTasks = 0;
  for (const task of tasks) {
    const fogNodeId = allocations.get(task.id);
    if (!fogNodeId) continue;

    const fogNode = fogNodes.find(f => f.id === fogNodeId);
    const device = devices.find(d => d.id === task.terminalDeviceId);
    if (!fogNode || !device) continue;

    const delay = calculateTotalDelay(task, fogNode);
    const energy = calculateEnergyConsumption(task, fogNode, device);

    if (delay <= task.maxToleranceTime && energy <= device.residualEnergy) {
      successfulTasks++;
    }
  }

  return {
    allocations,
    totalDelay: result.totalDelay,
    totalEnergy: result.totalEnergy,
    fitness: result.fitness,
    reliability: (successfulTasks / tasks.length) * 100
  };
}
