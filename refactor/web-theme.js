'use strict';

const Path        = require('path');
const _           = require('lodash');
const packageJSON = require('./package.json');

module.exports = function(config){

    config = config || {};
    config = _.defaultsDeep(config, {
        skin: 'default',
        rtl: false,
        lang: 'en',
        stylesheet: null,
        head: null,
        foot: null,
        contextFormat: 'json'
    });

    return function(){

        this.name    = 'mandelbrot';
        this.title   = 'A theme for Fractal.';
        this.version = packageJSON.version;

        this.defaults(config);

        this.views   = Path.join(__dirname, 'views');
        this.favicon = Path.join(__dirname, 'assets/favicon.ico');
        this.error   = 'pages/error.nunj';

        Object.defineProperty(this, 'stylesheet', {
           get: () => {
               return this.config.stylesheet || `${this.urlPath('/theme/css')}/${this.config.skin || 'default'}.css` ;
           }
        });

        this.static(Path.join(__dirname, 'dist'), `/theme`);

        this.route('/', {
            handle: 'overview',
            view: 'pages/page.nunj',
        });

        this.route('/docs', {
            redirect: '/'
        });

        this.route('/components', {
            redirect: '/'
        });

        this.route('/components/preview/:handle', {
            handle: 'preview',
            view: 'pages/components/preview.nunj'
        });

        this.route('/components/detail/:handle', {
            handle: 'component',
            view: 'pages/components/detail.nunj'
        });

        this.route('/docs/:path([^\?]+?)', {
            handle: 'page',
            view: 'pages/page.nunj'
        });

        this.builder = function(builder, app){

            const components = app.source('components');
            const docs       = app.source('docs');

            for (let comp of components.flatten()) {
                if (!comp.isHidden){
                    builder.addRoute('preview', {'handle':comp.handle});
                    builder.addRoute('component', {'handle':comp.handle});
                }
                for (let variant of comp.variants()) {
                    builder.addRoute('preview', {'handle':variant.handle});
                    if (!comp.isCollated){
                        builder.addRoute('component', {'handle':variant.handle});
                    }
                }
            }

            builder.addRoute('overview');
            for (let page of docs.flatten()) {
                if (!page.isHidden && page.path !== '') {
                    builder.addRoute('page', {'path':page.path});
                }
            }

        };

    }

};