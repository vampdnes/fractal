'use strict';

module.exports = {

    command: 'start',

    config: {
        description: 'Start a development server',
        options: [
            ['-p, --port <number>', `The port to run the server on.`],
            ['-t, --theme <package-name>', 'The name of custom UI theme to use, if required'],
            ['-s, --sync', 'Use BrowserSync to sync and reload pages when changes occur'],
            ['-w, --watch', 'Watch the filesystem for changes.']
        ]
    },

    action: function (args, done) {
        const server = this.fractal.web.server(args.options);
        server.on('ready',() => {

            const header       = "Fractal web UI server is running!";
            const footer       = this.fractal.cli.isInteractive() ? `Use the 'stop' command to stop the server.` : `Use ^C to stop the server.`;
            const serverUrl    = server.urls.server;
            const format       = this.console.themeValue('success.style', str => str);
            let body           = '';

            if (!server.isSynced) {
                body += `Local URL: ${format(serverUrl)}`;
            } else {
                const syncUrls  = server.urls.sync;
                body += `Local URL:      ${format(syncUrls.local)}`;
                body += `\nNetwork URL:    ${format(syncUrls.external)}`;
                body += `\nBrowserSync UI: ${format(syncUrls.ui)}`;
            }

            return this.console.box(header, body, footer).unslog();

        });
        server.start(args.options.sync);
        done();
    }

};