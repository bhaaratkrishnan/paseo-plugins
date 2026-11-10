# paseo-plugins

Local Paseo plugin monorepo. Each folder under `plugins/` is a separate plugin with its own
`paseo-plugin.json`, runtime entries, and `package.json`. They install and run independently on a
daemon.

```text
paseo-plugins/
  package.json                # npm workspaces: plugins/*
  plugins/
    quote-notes/              # select text in chat/files and reply with a quoted annotation
```

## Plugins

| Plugin | What it does | Install |
| --- | --- | --- |
| [`quote-notes`](plugins/quote-notes) | Select text in chat, a file, Markdown preview, diff, or terminal and attach it to your next message as a quote with an optional comment | `paseo plugin add git:bhaaratkrishnan/paseo-plugins:plugins/quote-notes` |

Every plugin installs independently. Add `--ref main` to pin the initial Git content, and see
[Install](#install) for local checkouts and removal.

## Requirements

- Paseo >= 0.15 (`paseo --version`)
- `pluginsEnabled: true` in the daemon `config.json` (Settings -> Plugins -> Enable plugins)
- Node/npm on the daemon host

## Develop

```bash
npm install                 # once, hoists all plugins
npm run typecheck           # every workspace
paseo plugin reload quote-notes
paseo plugin logs quote-notes
```

Source edits need `paseo plugin reload <id>`; do not restart the daemon.

## Install

From the public repo:

```bash
paseo plugin add git:bhaaratkrishnan/paseo-plugins:plugins/quote-notes
```

From a local checkout (absolute paths only; a bare relative path is read as a registry id):

```bash
paseo plugin install /absolute/path/paseo-plugins/plugins/quote-notes
paseo plugin ls
```

Remove with `paseo plugin remove <id>` (keeps the source folder).

## Add another plugin

```bash
paseo plugin init /absolute/path/paseo-plugins/plugins/my-plugin
npm install
```

Then edit `paseo-plugin.json` (`id`, `name`, `description`, `requirements.paseo`) and replace the
scaffold contributions. Plugin roots may only contain the entries (`index.client.tsx`,
`index.server.ts`) and `client/`, `server/`, `shared/` plus metadata files, so keep extra code
inside those directories.

## quote-notes

Vendored from [xzthemeofsss/paseo-plugins](https://github.com/xzthemeofsss/paseo-plugins) v0.2.2
(MIT, see `plugins/quote-notes/LICENSE`), then translated to English: the host language setting is
ignored and every label, tooltip, and error message is English only. It is not written against a
plugin API for quoting: Paseo 0.15 has no composer text API, so the plugin drives the host DOM
(`textarea[data-composer-input]`) and resolves the host's draft store through Metro's module
registry to attach the annotation as a composer attachment.

That means it can break when Paseo renames host selectors or internal modules, and it is the main
thing to check after a Paseo update:

- `plugins/quote-notes/client/web.ts` - host DOM contract constants at the top
- `plugins/quote-notes/client/host-draft-bridge.ts` - module signatures and store bridging

When Paseo ships the composer plugin API (`addComposerItem` / `useComposer().insertText`), this can
be replaced with a small plugin that inserts a plain blockquote instead of attaching to host state.
