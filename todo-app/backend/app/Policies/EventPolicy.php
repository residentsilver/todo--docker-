<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * イベントポリシー
 */
class EventPolicy
{
    use HandlesAuthorization;

    /**
     * ユーザーがイベントを表示できるか
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Event  $event
     * @return bool
     */
    public function view(User $user, Event $event)
    {
        return $user->id === $event->user_id;
    }

    /**
     * ユーザーがイベントを更新できるか
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Event  $event
     * @return bool
     */
    public function update(User $user, Event $event)
    {
        return $user->id === $event->user_id;
    }

    /**
     * ユーザーがイベントを削除できるか
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Event  $event
     * @return bool
     */
    public function delete(User $user, Event $event)
    {
        return $user->id === $event->user_id;
    }
}