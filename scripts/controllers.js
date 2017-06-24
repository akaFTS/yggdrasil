angular.module("yggdrasil")

//controller do sistema
.controller("AppCtrl", function($scope, trackService, skillService, myService, $timeout, $http) {

    $scope.skillStack = [];

    $scope.sks = skillService;
    $scope.ms = myService;
    $scope.ts = trackService;

    $scope.collapsed = [];

    //selecionar uma matéria para mais informações
    $scope.selectSkill = function(skill, stackAction) {

        if(skill.empty) return;

        //analytics
        if(typeof FB != 'undefined') {
            var params = {};
            params[FB.AppEvents.ParameterNames.SEARCH_STRING] = skill.code;
            FB.AppEvents.logEvent("Opened skill", null, params);
        }

        //resetamos a pilha se for um clique novo, adicionamos a skill atual caso não
        if(stackAction == 'reset')
            $scope.skillStack = [];
        else if(stackAction == 'push')
            $scope.skillStack.push($scope.selectedSkill);

        if (!$scope.fastswitch)
          $scope.showPanel = true;
        $scope.selectedSkill = skill;

        //vamos preparar o array de dependencias
        $scope.selectedSkill.deps = [];
        angular.forEach(skill.dependencies, function(depskill) {
            var skill = skillService.fetchSkill(depskill);
            $scope.selectedSkill.deps.push(skill);
        });

        //verificamos o status dela no cache
        $scope.selectedSkill.status = myService.mySkills[$scope.selectedSkill.code];
        if ($scope.fastswitch) {
            console.log($scope.selectedSkill.status);
            if ($scope.selectedSkill.status == 'done')
              $scope.setStatus('doing');
            else if ($scope.selectedSkill.status == 'doing')
              $scope.setStatus('');
            else if ($scope.selectedSkill.status == '' || $scope.selectedSkill.status == undefined)
              $scope.setStatus('done');
        }
    }

    //setar o status da matéria selecionada
    $scope.setStatus = function(status) {

        //analytics
        if(typeof FB != 'undefined') {
            var params = {};
            params[FB.AppEvents.ParameterNames.DESCRIPTION] = $scope.selectedSkill.code;
            if(status == 'done')
                FB.AppEvents.logEvent("Did skill", null, params);
            else if(status == 'doing')
                FB.AppEvents.logEvent("Doing skill", null, params);
        }


        myService.setSkill($scope.selectedSkill, status);
        $scope.selectedSkill.status = status;

        //atualizar as matérias que dependem dela
        var deps = skillService.getDependent($scope.selectedSkill.code);
        angular.forEach(deps, function(dep) {

            //pegar o objeto skill (dep é apenas o código)
            var skill = skillService.fetchSkill(dep);

            //se já estiver feita ou fazendo, não mexer
            if(myService.mySkills[dep] == 'done' || myService.mySkills[dep] == 'doing')
                return;

            //verificar se todas as dependencias dela estão cumpridas
            var locked = false;
            angular.forEach(skill.dependencies, function(skdep) {
                if(myService.mySkills[skdep] != 'done')
                    locked = true;
            });

            //marca-la como travada ou não
            if(locked)
                myService.setSkill(skill, 'locked');
            else
                myService.setSkill(skill, '');
        });
    }

    //voltar uma skill na pilha de chamadas de requisitos
    $scope.popStack = function() {
        $scope.selectSkill($scope.skillStack.pop(), 'none');
    }

    //des-seleciona a skill, mas com um timeout pra um visual melhor
    $scope.deselect = function () {
        $scope.showPanel = false;
        $timeout(function() {
            $scope.selectedSkill = false;            
        }, 400);
    }

    //pegar a porcentagem de conclusão de creditos
    $scope.getBarStyle = function(type) {

        if(myService.numCredits[type] > myService.totalCredits[type])
            return {width: "100%"};
        else
            return {width: Math.round(myService.numCredits[type]*100/myService.totalCredits[type])+"%", 'z-index': 3};
    }

    //pegar a porcentagem de creditos sendo feitos
    $scope.getDoingStyle = function(type) {

        //pegamos a quantidade de créditos feitos e fazendo
        var doingwidth = Math.round(myService.numDoing[type]*100/myService.totalCredits[type]);
        var donewidth = Math.round(myService.numCredits[type]*100/myService.totalCredits[type]);

        //normalizamos os créditos fazendo pra não estourar a barra
        if(doingwidth + donewidth > 100)
            doingwidth = 100 - donewidth;

        //retornamos se não for pra exibir nada
        if(doingwidth <= 0) return;

        //precisamos adicionar alguns pixels pro efeito visual
        return {
            width: "calc("+doingwidth+"% + 11px)", 
            'z-index': 2,
            left: "calc("+donewidth+"% - 10px)"
        };
    }

    //retorna um array de classes CSS do estado de seleção e do status da skill
    $scope.getSkillClasses = function (skill) {
        var classes = $scope.getSelectionClasses(skill);

        //se não estiver no modo de visão geral
        if(!$scope.general)
            classes.push(myService.mySkills[skill.code]);

        return classes;
    }

    //retorna um array de classes CSS do estado de seleção da skill
    $scope.getSelectionClasses = function(skill) {
        var classes = [];

        if(skill.empty)
            classes.push("empty");

        //se o painel já estiver fechando (showPanel falso) já não recebe a classe selected
        if(skill == $scope.selectedSkill && $scope.showPanel)
            classes.push("selected");

        return classes;        
    }

    //retorna um array de classes CSS para o objeto wrapper daquela skill.
    $scope.getBlockClasses = function (skill) {

        var classes = [];

        if(skill.block) {

            classes.push("blocked");

            //adicionar as cores
            classes.push("bg-light-"+skill.block.color);
            classes.push("border-"+skill.block.color);

            //adicionar as bordas horizontais
            angular.forEach(skill.block_x, function(pos) {
                classes.push("block-"+pos);

                //adicionar os cantos
                angular.forEach(skill.block_y, function(side) {
                    classes.push("block-"+pos+"-"+side);
                });
            });

            //adicionar as bordas laterais
            angular.forEach(skill.block_y, function(side) {
                classes.push("block-"+side);
            });
        }

        return classes;
    }

    //abrir a caixa de adicionar matéria
    $scope.openAddBox = function() {
        $scope.newSkill = {type: 1, isCustom: true};
        $scope.addBoxOpen = true;
    }

    //fechar a caixa de adicionar matéria
    $scope.closeAddBox = function() {
        $scope.addBoxOpen = false;
    }

    //buscar os dados da matéria no jupiter (SUSPENSO ATÉ EXISTIR BACKEND)
    $scope.askJupiter = function() {
        if(!$scope.newSkill.code) return;

        $http.get("https://uspdigital.usp.br/jupiterweb/obterDisciplina?sgldis="+$scope.newSkill.code).then(function(data) {
            var source = data.data;

            //extraimos a parte da pagina com os dados que queremos
            var index = source.indexOf("Disciplina:");
            var structure = source.substring(index, index+1500);

            //verificamos se achou
            var name = /- ([A-zÀ-ú ]*)/g.exec(structure);
            if(!name) return;

            //nome da disciplina
            $scope.newSkill.name = name[1];

            //creditos aula
            $scope.newSkill.credits = /Aula:[\s\w<>\\\/=",\-\#&;]*([0-9]+)[\s]*<\/span>/gm.exec(structure)[1];

            //creditos trabalho
            $scope.newSkill.wcredits = /Trabalho:[\s\w<>\\\/=",\-\#&;]*([0-9]+)[\s]*<\/span>/gm.exec(structure)[1];

        });
    }

    //adicionar a nova materia
    $scope.addSkill = function() {

        //validação de campos
        $scope.fillFields = $scope.codeExists = false;
        if(!$scope.newSkill.name || !$scope.newSkill.code || !$scope.newSkill.credits || !$scope.newSkill.wcredits) {
            $scope.fillFields = true;
            return;
        }

        //verificar se já existe a matéria
        var skill = skillService.fetchSkill($scope.newSkill.code.toUpperCase());
        if(skill) {
            $scope.codeExists = true;
            return;
        }

        //parsing dos créditos
        $scope.newSkill.credits = parseInt($scope.newSkill.credits) || 0;
        $scope.newSkill.wcredits = parseInt($scope.newSkill.wcredits) || 0;

        //adicionar a skill nas optativas
        skillService.addSkill(angular.copy($scope.newSkill), $scope.tracks[5].skills);

        $scope.addBoxOpen = false;

        //analytics
        if(typeof FB != 'undefined') {
            var params = {};
            params[FB.AppEvents.ParameterNames.DESCRIPTION] = skill.code;
            FB.AppEvents.logEvent("Created skill", null, params);
        }
    }

    //remova uma skill customizada
    $scope.removeSkill = function(skill) {
        skillService.removeSkill(skill, $scope.tracks[5].skills);
        $scope.deselect();
    }

    //carregamos as trilhas
    $scope.tracks = trackService.getTracks();

    //criamos um atalho pra usar o objeto global do angular na view (precisamos do equals())
    $scope.angular = angular;

})
