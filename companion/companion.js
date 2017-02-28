angular.module("companionApp", [])

.config(function($sceProvider) {
  // Completely disable SCE.  For demonstration purposes only!
  // Do not use in new projects.
  $sceProvider.enabled(false);
})

.controller("companionCtrl", function($scope, $http) {

    $scope.curSkill = {};

    $scope.load = function(track) {
        var tracks = ["obrigs", "teoria", "sistemas", "ia", "escience"];

        $scope.isLoaded = true;
        $scope.loadedTrack = tracks[track];

        $http.get("../skills/"+tracks[track]+".json").then(function(data) {
            $scope.tracklist = data.data;
        });
    }

    $scope.reset = function() {
        $scope.loadedTrack = undefined;
        $scope.isLoaded = false;
        $scope.tracklist = "";
    }

    $scope.loadSkill = function() {
        $http.get("http://bcc.ime.usp.br/catalogo2017/disciplinas/"+$scope.curSkill.code+".html").then(function(data) {
            $scope.website = data.data;
            
        });
    }

    $scope.addSkill = function() {

        $scope.curSkill.position = [];
        $scope.curSkill.position[0] = parseInt($scope.X);
        $scope.curSkill.position[1] = parseInt($scope.Y);


        $scope.tracklist.push($scope.curSkill);
        $scope.curSkill = {};
    }

    $scope.toJson = function(item) {
        if(!item) return "";
        return JSON.stringify(item);
    }
})