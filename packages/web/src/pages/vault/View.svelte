<script lang="ts">
    import { decrypt } from "../../encrypt";

    export let id: string;
    let loading = true;
    let hasPassword = false;
    let key = "";
    let password = "";
    let encrypted = "";
    let decrypted = "";

    (async () => {
        try {
            const result = await fetch(
                `http://localhost:4321/vault/${id}`,
            ).then((res) => {
                if (!res.ok) throw new Error("something went wrong");
                return res.json();
            });
            hasPassword = result.p;
            encrypted = result.c;
            console.log(result);
        } catch (error) {
            console.error(error);
        } finally {
            loading = false;
        }
    })();

    async function handleDecrypt() {
        decrypted = encrypted;
        if (hasPassword) {
            decrypted = await decrypt(decrypted, password);
        }
        decrypted = await decrypt(decrypted, key);
    }
</script>

<main>
    {#if loading}
        <p>loading...</p>
    {:else}
        <input placeholder="Key" type="text" bind:value={key} />
        {#if hasPassword}
            <input placeholder="Password" type="text" bind:value={password} />
        {/if}
        <button
            on:click={handleDecrypt}
            disabled={!key || (hasPassword && !password)}>Decrypt</button
        >
        {#if decrypted}
            <pre>{decrypted}</pre>
        {/if}
    {/if}
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        max-width: 42rem;
        align-items: center;
        margin: 0 auto;
        padding: 2rem 1rem;
        gap: 1rem;
    }
    input {
        padding: 0.25rem;
        width: 24rem;
    }
    button {
        padding: 0.5rem 1rem;
    }
</style>
