angular.module("yggdrasil", [])


//controller do sistema
.controller("AppCtrl", function($scope, trackService, skillService, $timeout) {

    $scope.skillStack = [];

    $scope.sks = skillService;


    //selecionar uma matéria para mais informações
    $scope.selectSkill = function(skill, stackAction) {


        if(skill.empty) return;

        //se já estiver selecionada, des-selecionar
        if($scope.selectedSkill == skill)
            $scope.deselect();

        //se não, selecionar esta
        else {

            //analytics
            var params = {};
            params[FB.AppEvents.ParameterNames.SEARCH_STRING] = skill.code;
            FB.AppEvents.logEvent("Opened skill", null, params);

            //resetamos a pilha se for um clique novo, adicionamos a skill atual caso não
            if(stackAction == 'reset')
                $scope.skillStack = [];
            else if(stackAction == 'push')
                $scope.skillStack.push($scope.selectedSkill);

            $scope.showPanel = true;
            $scope.selectedSkill = skill;

            $scope.selectedSkill.deps = [];

            //vamos preparar o array de dependencias
            angular.forEach(skill.dependencies, function(depskill) {
                var skill = skillService.fetchSkill(depskill);
                $scope.selectedSkill.deps.push(skill);
            });
        }
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

    //retorna um array de classes CSS para o objeto daquela skill.
    $scope.getSkillClasses = function (skill) {
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

    //abrir ou fechar a gaveta de um track
    $scope.toggleTrack = function(track) {

        //se estiver abrindo, marcamos um evento
        if(!track.collapsed) {
            var params = {};
            params[FB.AppEvents.ParameterNames.DESCRIPTION] = track.name;
            FB.AppEvents.logEvent("Opened track", null, params);
        }

        track.collapsed = !track.collapsed;
    }

    //carregamos as trilhas
    $scope.tracks = trackService.getTracks();

    //criamos um atalho pra usar o objeto global do angular na view (precisamos do equals())
    $scope.angular = angular;

})

//serviço que organiza as trilhas
.service("trackService", function(skillService) {

    //monta os objetos das 5 seções
    this.getTracks = function() {
        var tracks = [];

        tmptrack = {};
        tmptrack.name = "Obrigatórias";
        tmptrack.icon = "aprendiz";
        tmptrack.skills = skillService.getSkills(0, 8);
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Sistemas de Software";
        tmptrack.icon = "algoz";
        tmptrack.skills = skillService.getSkills(2, 3);
        tmptrack.collapsed = true;
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Inteligência Artificial";
        tmptrack.icon = "arquimago";
        tmptrack.skills = skillService.getSkills(3, 3);
        tmptrack.collapsed = true;
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Ciência de Dados";
        tmptrack.icon = "criador";
        tmptrack.skills = skillService.getSkills(4, 2);
        tmptrack.collapsed = true;
        tracks.push(tmptrack);

        tmptrack = {};
        tmptrack.name = "Teoria da Computação";
        tmptrack.icon = "mestre";
        tmptrack.message = "Cumprir todas as matérias de 2 dos 3 blocos principais (totalizando 4 ou 5) e mais algumas optativas, completando 7 matérias da trilha."
        tmptrack.skills = skillService.getSkills(1, 7);
        tmptrack.collapsed = true;
        tracks.push(tmptrack);

        return tracks;
    }
})

//serviço que carrega as matérias (skills) no sistema
.service("skillService", function($http, blockService, $q) {


    var that = this;
    var skillPromise = $http.get("skills/skills.json").then(function(data) {
        that.skillHash = data.data;
    });

    //buscar uma skill específica
    this.fetchSkill = function(code) {
        return this.skillHash[code];
    }

    //construir o grid de skills de uma certa trilha
    //0 = obrigatorias, 1 = teoria,
    //2 = sistemas, 3 = IA, 4 = e-science
    this.getSkills = function(track, gridsize) {

        //criamos o grid da trilha
        var skills = this.makeGrid(gridsize);

        var that = this;

        //buscamos no arquivo da trilha correta
        var options = ["obrigs", "teoria", "sistemas", "ia", "escience"];
        var trackPromise = $http.get("skills/"+options[track]+".json");

        //vamos aguardar o carregamento dos dois arquivos pra prosseguir
        $q.all([trackPromise, skillPromise]).then(function(data) {

            //preenchemos o grid com as materias
            angular.forEach(data[0].data, function(position, code) {

                //buscamos os dados da materia no hash, e adicionamos na posição correta
                var skill = angular.copy(that.fetchSkill(code));
                skill.position = position;
                skills[position[0]][position[1]] = skill;
            });

            //buscamos os blocos de optativas desta trilha
            blockService.getBlocks(track).then(function(blocks) {

                //configuramos cada bloco
                angular.forEach(blocks, function(block) {
                    blockService.getBoundaries(block, skills);
                });
            });
        });

        return skills;
    }

    //função criadora de grids
    this.makeGrid = function(gridsize) {
        var rows = [];
        for(i = 0; i < gridsize; i++) {
            rows[i] = [];
            for(j = 0; j < 6; j++) {
                rows[i][j] = {empty: true};
            }
        }
        return rows;
    }
})

//serviço que gerencia o layout dos blocos de matérias
.service("blockService", function($http, $q) {

    //buscar os blocos relacionados a uma certa trilha
    //os codigos são os mesmos do trackService
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

    //encontrar as bordas do bloco
    this.getBoundaries = function(block, skills) {

        //guardamos um grid que receberá o layout do bloco
        var grid = this.makeZeroGrid();

        //guardamos também uma pilha de casas do bloco
        var stack = [];

        //o atributo "bounds" possui um array de quadrados,
        //onde cada quadrado é um array de coordenadas para os pontos
        //top-left, top-right, bottom-left e bottom-right
        //isso permite que o bloco tenha um formato irregular e não apenas quadrado
        angular.forEach(block.bounds, function(square) {

            //lembrando que o grid tem moldura, então somamos um nas coordenadas
            for(i = square[0][1] + 1; i <= square[1][1] + 1; i++) {
                for(j = square[0][0] + 1; j <= square[2][0] + 1; j++) {

                    //marcamos com 1
                    grid[j][i] = 1;

                    //adicionamos na pilha desmoldurado
                    stack.push([j-1, i-1]);
                }
            }
        });


        //agora, verificamos cada slot do bloco, se é uma borda
        while(stack.length) {

            //pegamos a posição e o skill correspondente a ela
            var pos = stack.pop();
            var skil = skills[pos[0]][pos[1]];

            //atribuímos o bloco a esta skill
            skil.block = block;

            //criamos os arrays de borda dele
            //estes arrays informarão se estamos na borda do bloco
            skil.block_x = [];
            skil.block_y = [];

            //pegamos as posições no grid com moldura
            var x = pos[0]+1;
            var y = pos[1]+1;

            //verificamos se pra cima é 0 (estamos na borda de cima)
            if(!grid[x-1][y])
                skil.block_x.push("top");

            //idem pro resto
            if(!grid[x+1][y])
                skil.block_x.push("bottom");

            if(!grid[x][y-1])
                skil.block_y.push("left");

            if(!grid[x][y+1])
                skil.block_y.push("right");
        }
    }

    //função criadora de grids com moldura
    this.makeZeroGrid = function() {
        var rows = [];
        for(i = 0; i < 10; i++) {
            rows[i] = [];
            for(j = 0; j < 8; j++) {
                rows[i][j] = 0;
            }
        }
        return rows;
    }
})

.filter('toArray', function () {
    'use strict';

    return function (obj) {
        if (!(obj instanceof Object))
            return obj;

        return Object.keys(obj).map(function (key) {
            return Object.defineProperty(obj[key], '$key', {__proto__: null, value: key});
        });
    }
})

//filtro para a busca por matérias
.filter('filterSkill', function () {

    return function (array, query) {

        //se nada tiver sido buscado, retornar nada
        if(!query)
            return [];

        query = query.toLowerCase();
        var out = [];

        //buscar em todas as materias por nome e código
        angular.forEach(array, function(skill) {

            //se ja tiver 5 materias no array, deixar pra lá
            if(out.length >= 5) return;

            if(skill.code.toLowerCase().indexOf(query) > -1 || 
                skill.name.toLowerCase().indexOf(query) > -1)
                out.push(skill);
        });
        return out;
    }
})