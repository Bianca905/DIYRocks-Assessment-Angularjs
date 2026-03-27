# Task 1 - Code Review & Refactoring

## 問題分析

1. **非同步處理唔正確**
   - 問題：`getUsers()` 直接回傳 `users` array，但 `$http.get` 未完成時 `users` 係空。
   - 影響：UI 初始可能顯示空結果。
   - 修正：`getUsers()` 應該回傳 Promise，等 data ready 先用。

2. **缺少錯誤處理**
   - 問題：所有 `$http` request 冇 `.catch()`。
   - 影響：API 出錯冇提示，用戶唔知。
   - 修正：加 `.catch()`，log error 或傳返 controller。

3. **updateUser race condition**
   - 問題：PUT request 未完成就即刻 GET。
   - 影響：可能 reload 到舊數據。
   - 修正：用 `.then()` 等 PUT 完成再 GET。

4. **find() 代替 for loop**
   - 問題：程式碼冗長，要手動管理 i，可讀性差。
   - 影響：find()效能好 → 一搵到就停。
   - 修正： 用 `.find()`。

5. **search case-sensitive**
   - 問題：`query` 冇轉小寫。
   - 影響：Search 唔直覺，大小寫唔 match。
   - 修正：`query.toLowerCase()`。

6. **getUser 用 `==`**
   - 問題：用 `==`，可能有 type coercion bug。
   - 修正：改用 `===`。

7. **缺少 edge case**
   - 問題：`getUser` 如果搵唔到，冇 return。
   - 影響：可能回 `undefined`，UI crash。
   - 修正：加 `return null` 或 throw error。

8. **架構耦合過緊**
   - 問題：Controller 直接用 Service 嘅同步方法，冇 async handling。
   - 影響：UI 更新唔穩定。
   - 修正：Service return Promise，Controller 用 `.then()`。

9. **filter() 代替 for loop**
   - 問題：程式碼冗長，可讀性差。
   - 影響：filter()更易讀，唔需要手動 push。
   - 修正： 用 `.filter()`。

10. **更新用戶後重新 fetch 全部 users**
   - 問題：浪費資源。
   - 影響：浪費資源。
   - 修正：只更新更新user

11. **loadUsers() add retry**



---

## Html 改進
1. **搜尋輸入框**  
   - 加 `type="text` 同 `aria-label`，提升可及性。
2. **ng-repeat**  
   - 加 `track by user.id`，避免重複 key warning。
3. **按鈕設計**  
   - 加 `type="button`，避免誤觸發 form submit。因為如果喺 <form> 入面放一個 <button>，但冇指定 type，瀏覽器會默認佢係 type="submit"。
   - 加 `ng-disabled="loading"`，避免重複 click。loading = true → 按鈕會被禁用，唔可以再撳。
4. **空結果提示**  
   - `filteredUsers.length == 0` 改成 `=== 0`。  
  
## Refactor Code

### Service (UserDashboardService.js)
```js
angular.module('app')
.factory('UserDashboardService', function($http) {
  let users = [];
  
  function loadUsers(attempts = 0, maxRetries = 3, delay = 1000) {//1,8,11
    return $http.get('https://api.example.com/users')
      .then( res => {
        users = res.data;
        return users;
      })
      .catch(err => {//2
        attempts++;
        if (attempts < maxRetries) {
            console.warn(`第 ${attempts} 次失敗，${delay}ms 後重試...`);
            return new Promise(resolve => setTimeout(resolve, delay))
            .then(() => loadUsers(attempts, maxRetries, delay));
        } else {
            console.error('最終失敗，唔再重試', err);
            throw err;
        }
      });
    }


  return {
    getUsers: () => loadUsers(),

    getUser: (id) => {
      const user = users.find(u => u.id === id);//4,6,7
      return user || null;
    },

    updateUser: (id, changes) => {//3,10
      return $http.put(`https://api.example.com/users/${id}`, changes)
        .then(() => {
            // 更新本地 users array
            const index = users.findIndex(u => u.id === id);
            if (index !== -1) {
                users[index] = { ...users[index], ...changes };
            }
            return users;
        })
        .catch(err => {
          console.error('Failed to update user', err); 
          throw err; 
        });
    },

    searchUsers: (query) => {//5,9
      const q = query.toLowerCase();
      return users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
  };
});

//Controller (UserDashboardController.js)
angular.module('app')
.controller('UserDashboardController', function($scope, UserDashboardService) {
  $scope.filteredUsers = [];
  $scope.loading = false;
  
  UserDashboardService.getUsers()
  .then(users => {
    $scope.filteredUsers = users;
  }).catch(err => {
    alert('Failed to load users');
  });

  $scope.onSearch = function() {
    const query = $scope.searchQuery || '';
    $scope.filteredUsers = UserDashboardService.searchUsers(query);
  };

  $scope.makeAdmin = function(user) {
    $scope.loading = true;
    UserDashboardService.updateUser(user.id, { role: 'admin' })
      .then(users => {
        $scope.filteredUsers = users;
        $scope.loading = false;
      })
      .catch(err => {
        alert('Failed to update user');
        $scope.loading = false;
      });
  };
});

//Html
<div ng-controller="UserDashboardController">
  <input type="text" ng-model="searchQuery" ng-change="onSearch()"
         placeholder="Search users..." aria-label="Search users">
  
  <div ng-repeat="user in filteredUsers track by user.id">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
    <button type="button" ng-click="makeAdmin(user)" ng-disabled="loading">
      Make Admin
    </button>
  </div>

  <div ng-if="filteredUsers.length === 0 && !loading">No users found</div>
</div>

