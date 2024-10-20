<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Event;

/**
 * イベントコントローラー
 */
class EventController extends Controller
{
    /**
     * イベントの一覧取得
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        // 認証ユーザーのイベントを取得
        $events = auth()->user()->events()->orderBy('deadline', 'asc')->get();

        return response()->json($events);
    }

    /**
     * 新しいイベントの作成
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // バリデーション
        $request->validate([
            'name' => 'required|string|max:255',
            'deadline' => 'required|date|after:today',
        ]);

        // イベント作成
        $event = auth()->user()->events()->create([
            'name' => $request->name,
            'deadline' => $request->deadline,
        ]);

        return response()->json($event, 201);
    }

    /**
     * 特定のイベントの取得
     *
     * @param  \App\Models\Event  $event
     * @return \Illuminate\Http\Response
     */
    public function show(Event $event)
    {
        // 所有者確認
        $this->authorize('view', $event);

        return response()->json($event);
    }

    /**
     * イベントの更新
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Event  $event
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Event $event)
    {
        // 所有者確認
        $this->authorize('update', $event);

        // バリデーション
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'deadline' => 'sometimes|required|date|after:today',
        ]);

        // イベント更新
        $event->update($request->only(['name', 'deadline']));

        return response()->json($event);
    }

    /**
     * イベントの削除
     *
     * @param  \App\Models\Event  $event
     * @return \Illuminate\Http\Response
     */
    public function destroy(Event $event)
    {
        // 所有者確認
        $this->authorize('delete', $event);

        // イベント削除
        $event->delete();

        return response()->json(['message' => 'イベントを削除しました。']);
    }
}