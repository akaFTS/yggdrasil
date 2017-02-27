angular.module("yggdrasil", [])

.controller("AppCtrl", function($scope, trackService, $timeout) {

    //selecionar uma matéria para mais informações
    $scope.selectSkill = function(skill) {

        if(skill.empty) return;

        //se já estiver selecionada, des-selecionar
        if($scope.selectedSkill == skill)
            $scope.deselect();
        //se não, selecionar esta
        else {
            $scope.showPanel = true;
            $scope.selectedSkill = skill;
        }
    }

    //des-seleciona a skill, mas com um timeout pra um visual melhor
    $scope.deselect = function () {
        $scope.showPanel = false;
        $timeout(function() {
            $scope.selectedSkill = false;            
        }, 500);
    }

    $scope.tracks = trackService.getTracks();
})

.service("trackService", function(skillService) {
    this.getTracks = function() {
        var tracks = [];

        tmptrack = {};
        tmptrack.name = "Obrigatórias";
        tmptrack.icon = "aprendiz";
        tmptrack.skills = skillService.getSkills(0);
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Teoria da Computação";
        tmptrack.icon = "mestre";
        tmptrack.skills = skillService.getSkills(1);
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Sistemas de Software";
        tmptrack.icon = "algoz";
        tmptrack.skills = skillService.getSkills(2);
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Inteligência Artificial";
        tmptrack.icon = "arquimago";
        tmptrack.skills = skillService.getSkills(3);
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Ciência de Dados";
        tmptrack.icon = "criador";
        tmptrack.skills = skillService.getSkills(4);
        tracks.push(tmptrack);



        return tracks;
    }
})

.service("skillService", function($http) {

    //0 = obrigatorias, 1 = teoria,
    //2 = sistemas, 3 = IA, 4 = e-science
    this.getSkills = function(track) {
        var skills = this.makeGrid();

        var options = ["obrigs", "teoria", "sistemas", "ia", "escience"];

        //preencher a listagem
        $http.get("skills/"+options[track]+".json").then(function(data) {
            angular.forEach(data.data, function(item) {
                skills[item.position[0]][item.position[1]] = item;
            });
        });

        return skills;
    }

    //função criadora de grids
    this.makeGrid = function() {
        var rows = [];
        for(i = 0; i < 8; i++) {
            rows[i] = [];
            for(j = 0; j < 6; j++) {
                rows[i][j] = {empty: true};
            }
        }
        return rows;
    }
})