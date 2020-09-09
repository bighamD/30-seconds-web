import { execSync } from 'child_process';

/**
 * When called, allows modifying the development Express server.
 * API docs: https://www.gatsbyjs.org/docs/node-apis/#onCreateDevServer
 */
const onCreateDevServer = ({ app }) => {
  app.get('/create', (req, res) => {
    const dirName = '30dart';
    const snippetName = 'test';
    execSync(`cd ./content/sources/${dirName}; ../../../node_modules/@30-seconds/integration-tools/bin/newSnippet.js ${snippetName}`);
    res.send('ok');
  });
};

export default onCreateDevServer;
