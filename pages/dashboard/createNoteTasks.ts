import type { Task } from '../../types';

export function getTaskDrawerTriggerLabel(tasks: Task[]) {
  const incompleteCount = tasks.filter((task) => !task.completed).length;

  return {
    label: incompleteCount > 0 ? `${incompleteCount} Tasks` : 'Tasks',
    incompleteCount,
  };
}

export function getOrderedTasks(tasks: Task[]) {
  const openTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return [...openTasks, ...completedTasks];
}

export function getTaskMainPaddingClass({
  isMobile,
  isTasksOpen,
}: {
  isMobile: boolean;
  isTasksOpen: boolean;
}) {
  if (isMobile) {
    return 'lg:pl-0';
  }

  return isTasksOpen ? 'lg:pl-[440px]' : 'lg:pl-[180px]';
}
