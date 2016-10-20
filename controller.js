'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['require', 'lodash', 'backbone', 'backbone-prototype-compatibility'], function (require, lodash, Backbone) {
            return Backbone.Controller = factory(lodash, Backbone.Events, Backbone.View, Backbone.compatibility);
        });

    } else if (typeof exports !== 'undefined') {
        root.Backbone.Controller = factory(root.lodash, root.Backbone.Events, root.Backbone.View, root.Backbone.compatibility);

    } else {
        root.Backbone.Controller = factory(root.lodash, root.Backbone.Events, root.Backbone.View, root.Backbone.compatibility);
    }
}(this, function (lodash, BackboneEvents, BackboneView, compatibility) {
    /**
     * Controller
     *
     * The controller hold every relevant actions. The internal dispatcher dispatchs a route from
     * route parts without the parameters in the url. The dispatcher is looking for a method matching
     * to the route parts with the suffix (this.actionMethodSuffix) during the search. The parts will be reduced from
     * right to left. All parts of the route parts, which are not used, will be shift to the parameters
     * for the action method.
     *
     * @example Controller has the action "bundleEdit".
     *            the route is "bundle/edit/nuff/:id"
     *            the url is "bundle/edit/nuff/10"
     *            the url parts are [bundle, edit, nuff]
     *            the parameters are [10]
     *            the controller tests:
     *                1. bundleEditNuff -> failed -> adding "nuff" to parameters
     *                2. bundleEdit -> found -> calling "bundleEdit" with ("nuff", 10)
     *
     * @param {Object} [options]
     * @returns {Controller}
     */
    function Controller(options) {
        options = options || {};
        lodash.extend(this, options);

        this.cid = lodash.uniqueId('controller');

        this.initialize(options);
    }

    // prototyping
    Controller.prototype = Object.create(BackboneEvents, {
        /**
         * defines the suffix for action methods
         * @var {String}
         */
        actionMethodSuffix: {
            value: '',
            enumerable: true,
            configurable: true,
            writable: true
        },

        /**
         * @var {String}
         */
        cid: {
            value: null,
            enumerable: true,
            configurable: true,
            writable: true
        },

        /**
         * @var {String}
         */
        defaultAction: {
            value: 'index',
            enumerable: true,
            configurable: true,
            writable: true
        },

        /**
         * layout view
         *
         * @returns {BackboneView}
         */
        view: {
            value: null,
            enumerable: true,
            configurable: true,
            writable: true
        }
    });

    /**
     * dispatching a route
     *
     * @see Class doc
     * @param {Object} config
     * @param {Object} route
     * @param {Array} routeParts
     * @param {...*} [args] additional parameters
     * @returns {Controller}
     * @see for the config object see forge/backbone/router.js
     * @see for the route object see forge/backbone/router.js
     * @see for the routeParts array see forge/backbone/router.js
     */
    Controller.prototype.dispatch = function (config, route, routeParts, args) {
        return this.callActionMethod(
            config,
            route,
            this.findActionMethodAndParameters(
                route,
                routeParts,
                Array.prototype.slice.call(arguments, 3)
            )
        );
    };

    /**
     * call the acton method
     *
     * @param {Object} config
     * @param {Object} route
     * @param {Object} actionMethodAndParameters
     * @param {String} actionMethodAndParameters.method
     * @param {Array} actionMethodAndParameters.parameters
     * @return {Controller}
     */
    Controller.prototype.callActionMethod = function (config, route, actionMethodAndParameters) {
        // auto view remove?
        this.removeView(config, route);

        console.debug('dispatching the route "' + route.name + '" (url://' + route.route + ') to method "' + actionMethodAndParameters.method + '(' + actionMethodAndParameters.parameters.join(', ') + ')".');

        // call action and retrieve view instance
        var view = this[actionMethodAndParameters.method].apply(this, actionMethodAndParameters.parameters);

        if (view === undefined || view === null) {
            return this;
        }

        if ((view instanceof BackboneView) === false) {
            throw new Error('Action method "' + actionMethodAndParameters.method + '" must return a instance of BackboneView!');
        }

        // store current view
        this.view = view;

        return this;
    };

    /**
     * find the action method an the parameters
     *
     * @param {Object} route
     * @param {String} route.name
     * @param {String} route.route
     * @param {Array} routeParts
     * @param {Array} parameters additional parameters
     * @returns {Object} with "method" & "parameters"
     */
    Controller.prototype.findActionMethodAndParameters = function (route, routeParts, parameters) {
        // convert to correct type
        parameters = lodash.map(parameters, function (parameter) {
            var asNumber = Number(parameter);
            if (parameter !== null && isNaN(asNumber) === false) {
                return asNumber;
            }

            return parameter;
        });

        // camel case the parts
        var parts = lodash.map(routeParts, function (routePart, index) {
            // the first is lowercase
            if (index === 0) {
                return routePart;
            }

            return routePart.charAt(0).toUpperCase() + routePart.slice(1);
        });

        // find calling method
        var actionMethod        = null;
        var position            = parts.length;
        var listOfTestedMethods = [];
        while ((this[actionMethod] instanceof Function) === false && position > 0) {
            actionMethod = parts.slice(0, position).join('') + this.actionMethodSuffix;
            listOfTestedMethods.push(actionMethod);
            position--;
        }

        // nothing found
        if ((this[actionMethod] instanceof Function) === false && position == 0) {
            actionMethod = undefined;
            position     = -1;
        }

        // append the values of routeparts to parameters which not in actionMethod
        parameters = routeParts.slice(position + 1).concat(parameters);

        // default action
        if ((this.defaultAction !== undefined || this.defaultAction !== null) && (actionMethod === undefined || (this[actionMethod] instanceof Function) === false)) {
            actionMethod = this.defaultAction + this.actionMethodSuffix;
            console.info('route "' + route.name + '" (url://' + route.route + ') as no action method ("' + listOfTestedMethods.join('", "') + '"). Using default action method "' + actionMethod + '".');
        }

        // action method does not exists
        if ((this[actionMethod] instanceof Function) === false) {
            throw new Error('Action method "' + actionMethod + '" can not be called on controller for route "' + route.name + '" (url://' + route.route + ').');
        }

        return {
            method: actionMethod,
            parameters: parameters
        };
    };

    /**
     * init
     *
     * @param {Object} [options]
     * @returns {Controller}
     */
    Controller.prototype.initialize = function (options) {
        return this;
    };

    /**
     * removing
     *
     * @returns {Controller}
     */
    Controller.prototype.remove = function () {
        this.removeView().stopListening();

        return this;
    };

    /**
     * removing view
     *
     * @param {Object} config
     * @param {Object} route
     * @returns {Controller}
     */
    Controller.prototype.removeView = function (config, route) {
        if (this.view instanceof BackboneView) {
            this.view.remove();
            this.view = null;
        }

        return this;
    };

    return compatibility(Controller);
}));
