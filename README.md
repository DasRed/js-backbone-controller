# backbone-controller
This will be add controller to backbone.

## Install
```
bower install backbone-controller --save
```

# How To
The controller hold every relevant actions. The internal dispatcher dispatchs a route from
route parts without the parameters in the url. The dispatcher is looking for a method matching
to the route parts with the suffix "Action" during the search. The parts will be reduced from
right to left. All parts of the route parts, which are not used, will be shift to the parameters
for the action method. If no action method can be found with url parts,
the action "indexAction" from "defaultAction" property will be called
     
For example
 
- Controller has the action "bundleEditAction".
-  the route is "bundle/edit/nuff/:id"
- the url is "bundle/edit/nuff/10"
- the url parts are [bundle, edit, nuff]
- the parameters are [10]
- the controller tests:
  1. bundleEditNuffAction -> failed -> adding "nuff" to parameters
  2. bundleEditAction -> found -> calling "bundleEditAction" with ("nuff", 10)

