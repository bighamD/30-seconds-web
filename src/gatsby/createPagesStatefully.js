import chokidar from 'chokidar';
import paths from 'config/paths';
import fs from 'fs-extra';
import {
  compileSnippet,
  findConfigFromRawSnippetPath,
  findSlugFromRawSnippetPath
} from 'build/snippet';

const watchFiles = (contentDir, templates, { actions, store }) => {
  const { createPage, deletePage } = actions;
  const deletePageIfExists = slug => {
    const page = store.getState().pages.get(slug);
    if (page) deletePage({ path: page.path, component: page.component });
  };
  const watcher = chokidar.watch(
    `${contentDir}/**/*.md`,
    {
      ignored: `${contentDir}/**/README.md`,
      persistent: true,
    }
  );
  let isReady = false;

  const updateSnippet = path => {
    const snippetsPath = path.slice(0, path.lastIndexOf('/'));
    const snippet = path.slice(path.lastIndexOf('/') + 1);
    const config = findConfigFromRawSnippetPath(process.configs, path);
    compileSnippet(snippetsPath, snippet, config, true)
      .then(req => {
        deletePageIfExists(req.relRoute);
        createPage({
          path: req.relRoute,
          component: templates[req.template],
          context: req.context,
        });
      });
  };
  const deleteSnippet = path => {
    const slug = findSlugFromRawSnippetPath(process.configs, path);
    fs.removeSync(slug);
    deletePageIfExists(slug);
  };

  watcher
    .on('ready', () => { isReady = true; })
    .on('add', path => {
      if (isReady) updateSnippet(path);
    })
    .on('change', path => {
      if (isReady) updateSnippet(path);
    })
    .on('unlink', path => {
      if (isReady) deleteSnippet(path);
    });

  return watcher;
};

/**
 * Tell plugins to add pages.
 * Takes a list of requirable objects and a templates object.
 * Creates pages by running createPage for each ne.
 */
const createPagesStatefully = (templates, requirables) => ({ actions, store }) => {
  const { createPage } = actions;

  // First pass, create pages for files.
  requirables.forEach(req =>
    createPage({
      path: req.relRoute,
      component: templates[req.template],
      context: req.context,
    })
  );

  const mainListing = requirables.find(req => req.context.isMainListing);
  createPage({
    path: '/',
    component: templates[mainListing.template],
    context: mainListing.context,
  });

  watchFiles(paths.rawContentPath, templates, { actions, store });
};

export default createPagesStatefully;