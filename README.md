# narrykim.org

Website of the Narry Kim Lab (RNA biology) at the Institute for Basic Science
and Seoul National University. It is a Jekyll 4 site, built on the design and
code of the Chang lab's site ([qbio.io](https://qbio.io)).

## Working on it locally

You need Ruby (the version in `.ruby-version`) and Bundler 4. On the lab server they
come from the `nklabwww` conda env, defined in `environment.yml`; `run.sh` enters it
through `cdrun`:

```sh
conda env create -f environment.yml        # once; `conda env update` after edits
cdrun nklabwww "gem install --no-document bundler -v 4.0.6 && bundle install"
./run.sh                                   # preview at http://localhost:4001
```

Elsewhere, any Ruby of that version works: `gem install bundler -v 4.0.6`,
`bundle install`, `./run.sh`. Install libvips too (`brew install vips`,
`apt install libvips42t64`) to preview the resized WebP photos; without it the
preview shows the originals, and only a production build insists on it.

To check a production build the way CI does:

```sh
JEKYLL_ENV=production bundle exec jekyll build
bundle exec htmlproofer ./_site --disable-external --no-enforce-https \
  --swap-urls '^https\://narrykim\.org:'
```

## Editing content

Most changes are edits to YAML files in `_data/`: members (`team.yml`),
former members (`alumni_members.yml`), publications (`publist.yml`,
`chapters.yml`), news (`news.yml`) and photos (`photos.yml`).
`CLAUDE.md` describes each file's fields and the usual content tasks. Every
build checks these files and stops with a list of problems (an author `link`
missing from `team.yml`, a year out of order, a photo file that is not there,
...), so fix what it reports.

## Deployment

- **Live site:** every push to `main` is built and deployed to GitHub Pages by
  `.github/workflows/jekyll.yml`. Pull requests are built and link-checked, not
  deployed.
- **Outbound links:** every Monday `.github/workflows/external-links.yml` checks the
  links to other sites and keeps a "Broken external links" issue open while any fail.

Asset and navigation links are root-relative (`{{ site.baseurl }}/...`), never
`{{ site.url }}`; only canonical and Open Graph URLs are absolute.
