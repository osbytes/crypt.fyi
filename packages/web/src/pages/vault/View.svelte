<script lang="ts">
  import { config } from "../../config";
  import { decrypt } from "../../encryption";

  export let id: string;
  let loading = true;
  let hasPassword = false;
  let key = "";
  let password = "";
  let encrypted = "";
  let decrypted = "";
  let error: Error | null = null;
  let notExists = false;

  (async () => {
    try {
      const result = await fetch(`${config.API_URL}/vault/${id}`).then(
        (res) => {
          if (res.status === 404) {
            notExists = true;
            throw new Error("not found");
          }

          if (!res.ok) throw new Error("something went wrong");
          return res.json();
        }
      );
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
    try {
      decrypted = encrypted;
      if (hasPassword) {
        decrypted = await decrypt(decrypted, password);
      }
      decrypted = await decrypt(decrypted, key);
    } catch (e) {
      if (e instanceof Error) {
        error = e;
      } else {
        error = new Error("something went wrong");
      }
    }
  }
  function resetError() {
    console.log("here");
    error = null;
  }
</script>

<main>
  {#if loading}
    <p>loading...</p>
  {:else if notExists}
    <h2>Not Found</h2>
    <a href="/">home</a>
  {:else}
    <input
      placeholder="Key"
      type="text"
      bind:value={key}
      on:change={resetError}
    />
    {#if hasPassword}
      <input
        placeholder="Password"
        type="text"
        bind:value={password}
        on:change={resetError}
      />
    {/if}
    <button
      on:click={handleDecrypt}
      disabled={!key || (hasPassword && !password)}>Decrypt</button
    >
    {#if decrypted && !error}
      <pre>{decrypted}</pre>
    {/if}
    {#if error}
      <pre>{error.message || "something went wrong"}</pre>
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
