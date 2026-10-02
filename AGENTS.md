<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep simulated order data and rescue-action state entirely in the frontend; the console intentionally has no backend or database.
- Use the shared AppHeader for dashboard and summary navigation so both views keep the same visual shell.
- Keep storefront inventory, cart, partner audits, and operations demo state in the home route's React state so Reset Demo restores one connected frontend-only simulation.
