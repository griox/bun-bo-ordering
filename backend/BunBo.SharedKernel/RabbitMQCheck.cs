using System;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

class Program {
    static void Main() {
        var assembly = Assembly.Load("AspNetCore.HealthChecks.Rabbitmq");
        foreach(var type in assembly.GetExportedTypes()) {
            foreach(var method in type.GetMethods()) {
                if (method.Name == "AddRabbitMQ") {
                    Console.WriteLine(method);
                }
            }
        }
    }
}
