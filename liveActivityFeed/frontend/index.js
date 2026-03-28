angular.module('myApp', [])
  .controller('MainCtrl', function($scope, $http) {
    $scope.messages = [];
    $scope.priority = 'normal';
    $scope.missingInformation = false;
    $scope.fullOfHighPriorityEvents = false;
    $scope.lowPriority = 0;
    $scope.normalPriority = 0;
    $scope.highPriority = 0;
    $scope.events = [];
    $scope.env = 'http://localhost:3000';

    const ws = new WebSocket("ws://localhost:3000");

    ws.onopen = function() {
      console.log("WebSocket connected!");
    };

    ws.onmessage = function(event) {
        const newEvent = JSON.parse(event.data);
        $scope.$apply(() => {
            if (Array.isArray(newEvent)) {
                $scope.events = newEvent;
            } else {
                $scope.handleEvents(newEvent);
            }
            $scope.sortByPriority();
            $scope.countPriority();
        });
    };

   
    $scope.onSubmit = function(){
        const newEvent = {
            type: $scope.type,
            message: $scope.message,
            priority: $scope.priority,
            createdAt: Date.now()
        };
        $scope.missingInformation = false;
        if (!$scope.type || !$scope.message) {
            $scope.missingInformation = true;
            return;
        }
        $scope.createEvent(newEvent);
    };

    $scope.createEvent = function(event){
        $http.post($scope.env + "/createEvent", event)
        .then(function(res){
            console.log("Event created");
        })
        .catch(function(err){
            console.log("Error creating event:", err);
        })
    }

    $scope.sortByPriority = function() {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        $scope.events.sort(function(a, b) {
            const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (diff !== 0) return diff;

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    };

    $scope.countPriority = function() {
        $scope.lowPriority = $scope.events.filter(e => e.priority === "low").length;
        $scope.normalPriority = $scope.events.filter(e => e.priority === "normal").length;
        $scope.highPriority = $scope.events.filter(e => e.priority === "high").length;
    };

    $scope.handleEvents = function(data) {
        if (data.status === 429) {
            $scope.fullOfHighPriorityEvents = true;
            return;
        }

        if (data.status === 201) {
            const newEvent = data.event;
            if (data.dropped) {
            const dropped = data.dropped;
            $scope.events = $scope.events.filter(e => 
                new Date(e.createdAt).getTime() !== new Date(dropped.createdAt).getTime()
            );
            $scope.fullOfHighPriorityEvents = false;
            }
            $scope.events.unshift(newEvent);
        }
    };
  });
