# Source migration

Source imported from `NextShopKit/pro-development` at
`3fd8c0f955d5a0dbf951af724c5e044fe89139a2`.
The complete `src/` directory is preserved, including Pro source. The original
commit history remains available in `pro-development`; SDK history is retained.

## Cutover order

1. Merge the companion change removing `sync-sdk.yml` from `pro-development`.
   Disable that workflow before merging and ensure no old sync run is active:
   it force-pushes compiled output over SDK main.
2. Merge the source import into SDK main. Future SDK development happens here.
3. Configure `NPM_TOKEN` in SDK when ready to publish. Bump the package version
   and lockfile before manually running Publish SDK. No npm release is made
   as part of this migration.

The existing private `pro` distribution and its release workflow remain in
place. That workflow still builds from `pro-development`; migrating Pro release
automation is separate work. Do not archive `pro-development` while that release
path is needed. Historical SDK tags continue to point to their original builds.
