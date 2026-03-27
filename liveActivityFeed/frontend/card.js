angular.module('myApp')
  .directive('card', function() {
    return {
      restrict: 'E',
      scope: {
        type: '@',
        message: '@',
        priority: '@',
        createdAt: '@'
      },
      template: `
       <div class="card">
          <div ng-class="['priority', priority]"></div>
          <div class="content">
              <div class="type">
                  <span class="glyphicon glyphicon-star"></span>
                  <div class="text">{{type}}</div>
              </div>
              <div class="message">
                  <span class="glyphicon glyphicon-comment"></span>
                  <div class="text">{{message}}</div>
              </div>
              <div class="createdAt">
                  <span class="glyphicon glyphicon-calendar"></span>
                  <div class="text">{{formattedDate()}}</div>
              </div>
          </div>
      </div>
      `,
      controller: function($scope) {
        $scope.formattedDate = function() {
          return new Date(Number($scope.createdAt)).toLocaleString();
        };
      }
    };
  });
