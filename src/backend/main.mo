import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";

actor {
  type Task = {
    id : Nat;
    text : Text;
    completed : Bool;
  };

  module Task {
    public func compare(task1 : Task, task2 : Task) : Order.Order {
      Nat.compare(task1.id, task2.id);
    };
  };

  var nextTaskId = 0;

  let tasks = Map.empty<Nat, Task>();

  public shared ({ caller }) func addTask(text : Text) : async () {
    let task : Task = {
      id = nextTaskId;
      text;
      completed = false;
    };
    tasks.add(nextTaskId, task);
    nextTaskId += 1;
  };

  public query ({ caller }) func getTask(id : Nat) : async Task {
    switch (tasks.get(id)) {
      case (null) {
        Runtime.trap("Task does not exist");
      };
      case (?task) { task };
    };
  };

  public query ({ caller }) func listTasks() : async [Task] {
    tasks.values().toArray().sort();
  };

  public shared ({ caller }) func toggleTask(id : Nat) : async () {
    switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task does not exist") };
      case (?existingTask) {
        let updatedTask : Task = {
          id = existingTask.id;
          text = existingTask.text;
          completed = not existingTask.completed;
        };
        tasks.add(id, updatedTask);
      };
    };
  };

  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    if (not tasks.containsKey(id)) { Runtime.trap("Task does not exist") };
    tasks.remove(id);
  };
};
