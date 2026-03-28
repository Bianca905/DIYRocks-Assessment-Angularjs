# DIY Rocks (HK) Ltd. - Technical Assessment

## Overview
This repository contains my submission for the Full Stack Web Developer technical assessment.  
It includes:
- **Task 1**: Code Review & Refactoring (`REVIEW.md`)
- **Task 2**: Feature Implementation (Live Activity Feed)

## Setup

### 1. Clone the repo
git clone https://github.com/Bianca905/DIYRocks-Assessment-Angularjs.git
cd liveActivityFeed

**Backend**
npm install
node server.js


### Task 2 - Live Activity Feed

## 簡介
**即時活動訊息牆**，包含：
- **Backend (Node.js + Express + WebSocket)**  
- **Frontend (AngularJS)**  

---

## 功能描述

### Backend
- `POST /events` → 新增 event（包含 `type`, `message`, `priority - low, normal, high`）。
- `GET /events` → 取回 buffer（按 timestamp desc 排序）。
- Buffer 最多 50 個 event：
  - 新 event 入嚟時，如果 buffer full：
    - 先 drop 最舊嘅 **low-priority**。
    - 如果冇 low，就 drop 最舊嘅 **normal**。
    - **high-priority 永遠唔 drop**，如果 buffer 全部都係 high → 回 `429 Too Many Requests`。
- 新 event 會透過 **WebSocket** 即時推送到前端。

### Frontend
- 即時顯示 event feed，隨新 event 自動更新。
- 用顏色區分 priority（例如：紅色 = high、橙色 = normal、灰色 = low）。
- 提交新 event 嘅表單。
- 顯示 priority count。
- 處理 `429` error（UI alert）。

---

### 1. Which real-time approach did you choose and why? What are the trade-offs you considered?
我揀咗 **WebSocket**：
- 優點：雙向通訊、低延遲、適合多 client。
- 缺點：要管理連線同 scaling, 比 REST 複雜。
- Trade-off：比 polling 更高效，比 SSE 更靈活。

### 2. The priority-based eviction logic — how would this change if we needed to persist events to a database?
如果要 persist：
- 架構需加 database（PostgreSQL/MongoDB）。
- logic 要搬去 DB query。
- 架構要加 transaction 保證一致性。
- 不會真 delete，而係用 query filter 揀出 top N。
- 建立 index 喺 `priority` + `createdAt`。

### 3. If this needed to handle 10,000 connected clients, what would break first and what would you change?
- 最先爆：WebSocket server。
- 解決：
  - 改用 wss.clients.forEach 去所有 clients，而唔係只存最後一個。推送時要 broadcast 到全部 client。
  - 用多個 WebSocket server，放喺 load balancer 後面, Client 分流到唔同 server。
  - 加 backpressure handling ,Slow client handling, 慢 client 要 drop / 限速 / 斷線。

### 4. What did you intentionally leave out that you would add for production?
- JWT 登入驗證,確保只有合法用戶可以發 event。
- Error handling & Retry 機制。。
- 加 backpressure handling ,Slow client handling。







