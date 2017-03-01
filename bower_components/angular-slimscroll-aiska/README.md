# angular-slimScroll
[![Gitter](https://badges.gitter.im/aiska/angular-slimScroll.svg)](https://gitter.im/aiska/angular-slimScroll?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
-------
Angular JS implementation of jQuery-slimScroll without JQuery Dependencies

#### ngSlimscroll
AngularJS implementation of slimScroll

Originally developed by Piotr Rochala ([http://rocha.la](http://rocha.la))
[jQuery version](https://github.com/rochal/jQuery-slimScroll)

Install
-------

#### With bower:

    $ bower install angular-slimScroll

#### With npm

    $ npm install angular-slimscroll

#### Example Configuration (bower)
```html
<!DOCTYPE html>
<html ng-app="app">
<body>

<div slim-scroll height="300px">
    Content ...
</div>

<script type="text/javascript" src="bower_components/angular/angular.min.js"></script>
<script type="text/javascript" src="bower_components/angular-slimScroll/angular-slimScroll.min.js"></script>
<script type="text/javascript">
    var app = angular.module('app', [
        'ngSlimScroll'
    ]);</script>
</body>
</html>
```


