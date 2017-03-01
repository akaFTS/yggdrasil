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

    $scope.getSkillClasses = function (skill) {

        var classes = [];

        if(skill.empty)
            classes.push("empty");

        if(skill == $scope.selectedSkill && $scope.showPanel)
            classes.push("selected");

        return classes;
    }

    $scope.getBlockClasses = function (skill) {

        var classes = [];

        if(skill.block) {

            //adicionar as cores
            classes.push("bg-light-"+skill.block.color);
            classes.push("border-"+skill.block.color);

            //adicionar as bordas
            angular.forEach(skill.block_position_x, function(pos) {
                classes.push("block-"+pos);
                angular.forEach(skill.block_position_y, function(side) {
                    classes.push("block-"+pos+"-"+side);
                });
            });
            angular.forEach(skill.block_position_y, function(side) {
                classes.push("block-"+side);
            });
        }

        return classes;
    }

    $scope.getLabelClasses = function(skill) {
        var classes = [];

        if(skill.block) {
            classes.push("bg-"+skill.block.color);
        }

        return classes;
    }

    $scope.tracks = trackService.getTracks();
    $scope.angular = angular;

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
        tmptrack.collapsed = true;
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Sistemas de Software";
        tmptrack.icon = "algoz";
        tmptrack.skills = skillService.getSkills(2);
        tmptrack.collapsed = true;
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Inteligência Artificial";
        tmptrack.icon = "arquimago";
        tmptrack.skills = skillService.getSkills(3);
        tmptrack.collapsed = true;
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Ciência de Dados";
        tmptrack.icon = "criador";
        tmptrack.skills = skillService.getSkills(4);
        tmptrack.collapsed = true;
        tracks.push(tmptrack);



        return tracks;
    }
})

.service("skillService", function($http, blockService) {

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

            blockService.getBlocks(track).then(function(blocks) {
                angular.forEach(blocks, function(block) {
                    skills[5][3].block = block;
                    skills[5][3].block_position_x = ["top","bottom"];
                    skills[5][3].block_position_y = ["left"];

                    skills[5][4].block = block;
                    skills[5][4].block_position_x = ["top", "bottom"];

                    skills[5][5].block = block;
                    skills[5][5].block_position_x = ["top","bottom"];
                    skills[5][5].block_position_y = ["right"];
                });
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

.service("blockService", function($http, $q) {

    this.getBlocks = function(track) {

        var deferred = $q.defer();

        var blocks = [];

        $http.get("skills/blocks.json").then(function(data) {
            angular.forEach(data.data, function(block) {
                if(block.track == track)
                    blocks.push(block);
            });

            deferred.resolve(blocks);
        })

        return deferred.promise;
    }
})