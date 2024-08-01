<script lang="ts">
    import { decrypt, encrypt, generateRandomString } from "../../encrypt";

    let rawValue = "";
    let burn = true;
    let password = "";
    let loading = false;
    let id = "";
    let dt = "";
    let key = "";
    async function handleCreate() {
        loading = true;
        try {
            const _key = await generateRandomString(20);
            let encrypted = await encrypt(rawValue, _key);
            if (password) {
                encrypted = await encrypt(encrypted, password);
            }
            key = _key;

            const result = await fetch("http://localhost:4321/vault", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    c: encrypted,
                    b: burn,
                    p: !!password,
                    // TODO: add ttl
                }),
            }).then((r) => {
                if (!r.ok) throw new Error("something went wrong");
                return r.json() as Promise<{ id: string; dt: string }>;
            });
            if (!result) {
                throw new Error("something went wrong");
            }

            id = result.id;
            dt = result.dt;
        } catch (error) {
            console.error(error);
        } finally {
            loading = false;
        }
    }

    // TODO: figure out deletion
    // async function deleteVault() {
    //     await fetch(`http://localhost:4321/vault/${id}?dt=${dt}`, {
    //         method: "DELETE",
    //     });
    // }
</script>

<main>
    {#if !id}
        <textarea rows={10} bind:value={rawValue} disabled={loading} />
        <label for="burn" class="pointer">
            <input
                type="checkbox"
                name="burn"
                disabled={loading}
                bind:checked={burn}
                id="burn"
            />
            burn after reading
        </label>
        <input
            placeholder="Password (recommended)"
            type="text"
            name="password"
            id="password"
            bind:value={password}
            disabled={loading}
        />
        <button
            on:click={handleCreate}
            disabled={!rawValue || loading}
            type="submit"
            class="pointer">Create</button
        >
    {:else}
        <pre><a href="/#">{window.location.origin}/{id}</a></pre>
        <pre>{key}</pre>
        <!-- {#if dt}
            TODO: figure out deletion
            <button on:click={deleteVault}>delete</button>
        {/if} -->
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
    textarea {
        width: 100%;
        padding: 0.25rem;
    }
    button {
        padding: 0.5rem 1rem;
    }
    .pointer {
        cursor: pointer;
    }
    input#password {
        padding: 0.25rem;
        min-width: 12rem;
    }
</style>
