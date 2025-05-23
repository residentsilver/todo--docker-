<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Todo;

/**
 * 既存のTodoレコードに順序を設定するコマンド
 * 
 * @description orderカラムが0または未設定のTodoレコードに適切な順序を設定
 * @author システム開発者
 * @version 1.0
 */
class UpdateTodoOrder extends Command
{
    /**
     * コマンドの名前とシグネチャ
     *
     * @var string
     */
    protected $signature = 'todo:update-order {--force : 強制的に全てのTodoの順序を再設定}';

    /**
     * コマンドの説明
     *
     * @var string
     */
    protected $description = '既存のTodoレコードに順序を設定します';

    /**
     * コマンドを実行
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Todo順序の更新を開始します...');

        try {
            if ($this->option('force')) {
                // 強制モード：全てのTodoの順序を再設定
                $this->info('強制モード：全てのTodoの順序を再設定します');
                $todos = Todo::orderBy('created_at')->get();
            } else {
                // 通常モード：orderが0または未設定のTodoのみ
                $todos = Todo::where('order', 0)
                            ->orWhereNull('order')
                            ->orderBy('created_at')
                            ->get();
            }

            $this->info("対象のTodoレコード数: {$todos->count()}");

            if ($todos->count() === 0) {
                $this->info('更新対象のTodoレコードはありません。');
                return 0;
            }

            // 現在の最大order値を取得
            $maxOrder = Todo::max('order') ?? 0;
            $this->info("現在の最大order値: {$maxOrder}");

            $bar = $this->output->createProgressBar($todos->count());
            $bar->start();

            foreach ($todos as $index => $todo) {
                $newOrder = $this->option('force') ? $index + 1 : $maxOrder + $index + 1;
                
                $todo->update(['order' => $newOrder]);
                
                $this->line('');
                $this->info("Todo ID: {$todo->id}, Title: '{$todo->title}', New Order: {$newOrder}");
                
                $bar->advance();
            }

            $bar->finish();
            $this->line('');
            $this->info('Todo順序の更新が完了しました！');

            // 更新後の状態を表示
            $this->info('更新後のTodo一覧:');
            $updatedTodos = Todo::ordered()->get();
            foreach ($updatedTodos as $todo) {
                $this->line("ID: {$todo->id}, Order: {$todo->order}, Title: '{$todo->title}'");
            }

            return 0;

        } catch (\Exception $e) {
            $this->error('Todo順序の更新中にエラーが発生しました:');
            $this->error($e->getMessage());
            return 1;
        }
    }
} 