<script lang="ts">
  import { Router, Route } from "svelte-routing";
  import Create from "./pages/vault/Create.svelte";
  import View from "./pages/vault/View.svelte";

  export let url = "";
</script>

<Router {url}>
  <Route path="/" component={Create} />
  <Route path="/:id" let:params>
    <View id={params.id} />
  </Route>
</Router>

<style>
</style>
