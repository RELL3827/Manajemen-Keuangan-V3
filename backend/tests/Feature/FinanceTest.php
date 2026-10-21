<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_income_and_balance_increases(): void
    {
        $user = User::factory()->create();
        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'BCA',
            'type' => 'bank',
            'balance' => 1000000,
            'initial_balance' => 1000000,
        ]);
        $category = Category::create([
            'user_id' => $user->id,
            'name' => 'Gaji',
            'type' => 'income',
        ]);

        $response = $this->actingAs($user)->postJson('/api/transactions', [
            'account_id' => $account->id,
            'category_id' => $category->id,
            'name' => 'Gaji Bulanan',
            'type' => 'income',
            'amount' => 5000000,
            'date' => now()->toDateString(),
        ]);

        $response->assertStatus(201);
        $this->assertEquals(6000000, (float) $account->fresh()->balance);
    }

    public function test_user_can_create_expense_and_balance_decreases(): void
    {
        $user = User::factory()->create();
        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Dompet Tunai',
            'type' => 'cash',
            'balance' => 500000,
            'initial_balance' => 500000,
        ]);
        $category = Category::create([
            'user_id' => $user->id,
            'name' => 'Makanan',
            'type' => 'expense',
        ]);

        $response = $this->actingAs($user)->postJson('/api/transactions', [
            'account_id' => $account->id,
            'category_id' => $category->id,
            'name' => 'Beli Makan Siang',
            'type' => 'expense',
            'amount' => 50000,
            'date' => now()->toDateString(),
        ]);

        $response->assertStatus(201);
        $this->assertEquals(450000, (float) $account->fresh()->balance);
    }

    public function test_transfer_updates_both_account_balances_correctly(): void
    {
        $user = User::factory()->create();
        $fromAccount = Account::create([
            'user_id' => $user->id,
            'name' => 'BCA',
            'type' => 'bank',
            'balance' => 2000000,
            'initial_balance' => 2000000,
        ]);
        $toAccount = Account::create([
            'user_id' => $user->id,
            'name' => 'GoPay',
            'type' => 'ewallet',
            'balance' => 100000,
            'initial_balance' => 100000,
        ]);

        $response = $this->actingAs($user)->postJson('/api/accounts/transfer', [
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => 300000,
            'notes' => 'Top Up GoPay',
        ]);

        $response->assertStatus(200);
        $this->assertEquals(1700000, (float) $fromAccount->fresh()->balance);
        $this->assertEquals(400000, (float) $toAccount->fresh()->balance);
    }

    public function test_user_cannot_access_or_modify_other_users_data(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $accountB = Account::create([
            'user_id' => $userB->id,
            'name' => 'Rahasia B',
            'type' => 'bank',
            'balance' => 9999999,
        ]);

        // User A tries to view User B's account
        $response = $this->actingAs($userA)->getJson("/api/accounts/{$accountB->id}");
        $response->assertStatus(404);

        // User A tries to delete User B's account
        $deleteResponse = $this->actingAs($userA)->deleteJson("/api/accounts/{$accountB->id}");
        $deleteResponse->assertStatus(404);
    }

    public function test_voice_interpretation_parses_indonesian_command(): void
    {
        $user = User::factory()->create();
        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Dompet Tunai',
            'type' => 'cash',
            'balance' => 100000,
        ]);
        $category = Category::create([
            'user_id' => $user->id,
            'name' => 'Makanan',
            'type' => 'expense',
        ]);

        $response = $this->actingAs($user)->postJson('/api/transactions/voice-interpret', [
            'text' => 'Tadi beli makan 25 ribu dari dompet tunai',
        ]);

        $response->assertStatus(200);
        $json = $response->json();
        $this->assertEquals('expense', $json['interpreted']['type']);
        $this->assertEquals(25000, $json['interpreted']['amount']);
        $this->assertEquals('Makanan', $json['interpreted']['category_name']);
        $this->assertEquals('Dompet Tunai', $json['interpreted']['account_name']);
    }
}
