<script lang="ts">
	import ChatWidget from '../lib/components/ChatWidget.svelte';
</script>

<div class="container">
	<header>
		<h1>SpurStore Customer Support</h1>
		<p>Welcome! How can we help you today?</p>
	</header>
	
	<ChatWidget />
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: #1a1a1a;
	}

	header p {
		font-size: 1.2rem;
		color: #666;
	}
</style>

