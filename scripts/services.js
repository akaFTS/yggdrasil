angular.module("yggdrasil")

//serviço que organiza o curso da pessoa
.service("myService", function($localStorage) {

    //reseta o cache e recarrega a pagina
    this.wipeCache = function() {
        $localStorage.$reset();
        location.reload();
    }


    //colocar tudo pra funcionar
    this.setup = function() {

        //se ja existir no cache, pegar
        if($localStorage.mySkills) {
            this.mySkills = $localStorage.mySkills;
            this.numCredits = $localStorage.numCredits;
            this.blockSize = $localStorage.blockSize;
            this.freeSkills = $localStorage.freeSkills;
            this.doingNow = $localStorage.doingNow;
            this.customList = $localStorage.customList;
        }

        //senão, criar e guardar no cache
        else {

            //guarda o status de cada materia: feito, fazendo, a fazer, trancado
            $localStorage.mySkills = this.mySkills = {};

            //guarda o numero de creditos feitos entre obrigatorias, eletivas e livres
            $localStorage.numCredits = this.numCredits = [0,0,0];

            //guarda quantas materias de cada bloco ja foram feitas
            $localStorage.blockSize = this.blockSize = {};

            //guarda as materias eletivas convertidas em livres
            $localStorage.freeSkills = this.freeSkills = {};

            //guarda as materias sendo feitas agora, pra exibir no topo
            $localStorage.doingNow = this.doingNow = {pointer: 0, array: []};

            //guarda as materias que o usuario criou
            $localStorage.customList = this.customList = {};

            //encher com skills vazias
            for(var i = 0; i < 6; i++)  {
                this.doingNow.array.push({empty: true});
            }
        }

        //estrutura nova - deve ser criada à parte pra não bagunçar o cache existente das pessoas
        if($localStorage.numDoing)
            this.numDoing = $localStorage.numDoing
        else {
            $localStorage.numDoing = this.numDoing = [0,0,0];

            //vamos varrer as matérias que ele está fazendo e adicionar
            //isso não acontece nas outras estruturas porque era possivel resetar a base, mas agora
            //tem gente usando
            for(var i = 0; i < this.doingNow.pointer; i++) {
                var sk = this.doingNow.array[i];

                // adiciona os creditos na contagem
                var skcr = parseInt(parseInt(sk.credits) + parseInt(sk.wcredits || 0));
                this.numDoing[sk.type] += skcr;    
            }
        }
    }


    //transforma uma optativa eletiva em livre ou vice-versa
    this.toggleFree = function(skill) {

        if(!skill.isFree) {

            //adicionar no array de livres convertidas
            this.freeSkills[skill.code] = skill;

            //abater dos creditos originais e adicionar nas livres
            var skcr = parseInt(parseInt(skill.credits) + parseInt(skill.wcredits || 0));
            this.numCredits[1] -= skcr;
            this.numCredits[2] += skcr;
            skill.isFree = true;
        } else {

            //retirar do array
            delete this.freeSkills[skill.code];

            //abater dos creditos livres e adicionar nos originais
            var skcr = parseInt(parseInt(skill.credits) + parseInt(skill.wcredits || 0));
            this.numCredits[2] -= skcr;
            this.numCredits[1] += skcr;
            skill.isFree = false;
        }
    }

    //seta uma skill pra alguma categoria
    this.setSkill = function(skill, cat) {

        //se for igual nem tem o que fazer
        if(this.mySkills[skill.code] == cat) return;

        var skcr = parseInt(parseInt(skill.credits) + parseInt(skill.wcredits || 0));

        //se estiver tirando uma fazendo tem que tirar da listinha e do contador
        if(this.mySkills[skill.code] == 'doing') {
            var index = this.doingNow.array.indexOf(skill);
            this.doingNow.array.splice(index, 1);
            this.doingNow.array.push({empty: true});
            this.doingNow.pointer--;

            this.numDoing[skill.type] -= skcr;

        } //se estiver tirando uma feita tem que descontar os creditos
        else if(this.mySkills[skill.code] == 'done') {

            //verificar se ele é de algum bloco e remover
            if(skill.block && skill.block.cap != "-") {
                this.blockSize[skill.block.id]--;
            }   

            

            //se ela tiver sido convertida numa optativa livre, descontar dos livres e desconverter
            if(skill.isFree)
                this.numCredits[2] -= skcr;
            else
                this.numCredits[skill.type] -= skcr;
            skill.isFree = false;

            this.mySkills[skill.code] = cat;         
        }


        //marcar a categoria
        this.mySkills[skill.code] = cat;

        //temos que adicionar na lista
        if(cat == 'doing' && this.doingNow.pointer < 6) {

            //se estourou a listinha, deixa pra la
            if(this.doingNow.pointer >= 6) return;

            this.doingNow.array[this.doingNow.pointer] = skill;
            this.doingNow.pointer++;

            // adiciona os creditos na contagem
            this.numDoing[skill.type] += skcr;

        } //se estiver marcando como feito
        else if(cat == 'done') {

            //vamos verificar se ele é de algum bloco com tamanho definido
            if(skill.block && skill.block.cap != "-") {

                //criar a entrada se não tiver
                if(!this.blockSize[skill.block.id])
                    this.blockSize[skill.block.id] = 0;

                //incrementar
                this.blockSize[skill.block.id]++;
            }

            // adiciona os creditos na contagem
            this.numCredits[skill.type] += skcr;

        } //se estiver marcando como não feito, verificar se deve ser travado 
        else if(cat == '') {

            var locked = false;
            var that = this;
            angular.forEach(skill.dependencies, function(dep) {
                if(that.mySkills[dep] != 'done')
                    locked = true;
            });

            if(locked)
                this.mySkills[skill.code] = 'locked';
        }
    }

    this.totalCredits = [115, 56, 24];
    this.setup();
})

//serviço que organiza as trilhas
.service("trackService", function($http, skillService) {

    //monta os objetos das 5 seções
    this.isLoaded = false;
    this.getTracks = function() {
        var tracks = [];
        var that = this;
        $http.get("skills/tracks.json").then(function(data) {

            angular.forEach(data.data, function(track) {

                //apenas o id 0 (obrigatórias) fica aberto
                track.collapsed = !!track.id;
                track.skills = skillService.getSkills(track.id, track.canvas_size);
                tracks.push(track);
            });
            that.isLoaded = true;

        });

        return tracks;
    }
})

//serviço que carrega as matérias (skills) no sistema
.service("skillService", function($http, blockService, $q, myService) {

    this.skillHash = {};
    this.dependencyTree = {};
    this.optSlot = [1,4];

    var that = this;
    var skillPromise = $http.get("skills/skills.json").then(function(data) {
        that.skillHash = data.data;
    });


    //construir a estrutura de dependencias
    skillPromise.then(function() {
        angular.forEach(that.skillHash, function(skill) {

            //vamos varrer as dependencias de cada skill
            //e montar uma estrutura skill -> skills que dependem dela
            angular.forEach(skill.dependencies, function(dep) {
                if(!that.dependencyTree[dep])
                    that.dependencyTree[dep] = [];

                that.dependencyTree[dep].push(skill.code);
            });
        });
    });

    //buscar uma skill específica
    this.fetchSkill = function(code) {
        return this.skillHash[code];
    }

    //buscar as materias que dependem de uma skill
    this.getDependent = function(code) {
        return this.dependencyTree[code];
    }

    //construir o grid de skills de uma certa trilha
    //0 = obrigatorias, 1 = teoria,
    //2 = sistemas, 3 = IA, 4 = e-science
    this.getSkills = function(track, gridsize) {

        //criamos o grid da trilha
        var skills = this.makeGrid(gridsize);

        var that = this;

        //buscamos no arquivo da trilha correta
        var options = ["obrigs", "teoria", "sistemas", "ia", "escience", "opts"];
        var trackPromise = $http.get("skills/"+options[track]+".json");

        //vamos aguardar o carregamento dos dois arquivos pra prosseguir
        $q.all([trackPromise, skillPromise]).then(function(data) {

            //preenchemos o grid com as materias
            angular.forEach(data[0].data, function(code, poscode) {

                //quebramos as coordenadas
                position = poscode.split(",").map(function(item) {
                    return parseInt(item, 10);
                });

                //buscamos os dados da materia no hash
                var skref = that.fetchSkill(code);

                //marcamos ela como obrigatoria ou eletiva direto no array
                if(track == 0)
                    //se for optativa de estat, entra como eletiva
                    if(skref.code == "MAE0217" || skref.code == "MAE0221" || skref.code == "MAE0228")
                        skref.type = 1;
                    else
                        skref.type = 0;
                else
                    skref.type = 1;


                //verificamos se ela é uma eletiva que está sendo usada como livre
                if(myService.freeSkills[skref.code])
                    skref.isFree = true;

                //duplicamos e adicionamos no local correto
                var skill = angular.copy(skref);
                skill.position = position;
                skills[position[0]][position[1]] = skill;

                //na primeira config, se tiver pre-requisitos, travar
                if(typeof myService.mySkills[skill.code] == 'undefined' && skill.dependencies.length)
                    myService.setSkill(skill, "locked");
    
            });

            //optativas, vamos buscar as customizadas no cache também
            if(track == 5) {
                angular.forEach(myService.customList, function(skill) {
                    that.addSkill(skill, skills);

                    //verificamos se ela é uma eletiva que está sendo usada como livre
                    if(myService.freeSkills[skill.code])
                        skill.isFree = true;
                });
            }

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

    //função que adiciona uma nova skill
    this.addSkill = function(skill, track) {

        this.skillHash[skill.code] = skill;

        //se a materia ainda não estiver no cache (i.e. esta sendo criada agora), limpar
        if(!myService.mySkills[skill.code])
            myService.setSkill(skill, "");

        //adiciona no grid
        track[this.optSlot[0]][this.optSlot[1]] = skill;
        skill.position = [this.optSlot[0], this.optSlot[1]];

        //adiciona no cache
        myService.customList[skill.code] = skill;

        //atualiza o ponteiro
        this.optSlot[1] = this.optSlot[1]+1 % 6;
        if(this.optSlot[1] == 0)
            this.optSlot[0]++;
    }

    this.removeSkill = function(skill, track) {
        //setamos como não-feita pra limpar os créditos
        myService.setSkill(skill, '');

        //removemos
        delete this.skillHash[skill.code];

        //removemos do cache
        delete myService.customList[skill.code];

        //achamos o cara no grid
        var i;
        for(i = 4; i <= 24; i++) {
            var target = track[Math.floor(i/6 + 1)][i%6];
            if(target.code == skill.code)
                break;
        }

        //removemos e shiftamos todo mundo
        track[Math.floor(i/6 + 1)][i%6] = {empty: true};
        var j;
        for(j = i+1; j <= 24; j++) {
            //pegamos o valor
            var target  = track[Math.floor(j/6 + 1)][j%6];

            if(target.empty) break;

            //atualizamos o valor da posição dele para um anterior
            target.position[1] = target.position[1]-1 % 6;
            if(target.position[1] == 5)
                target.position[0]--;

            //shiftamos ele para o anterior
            track[target.position[0]][target.position[1]] = target;
            track[Math.floor(j/6 + 1)][j%6] = {empty: true};
        }

        //atualiza o ponteiro
        this.optSlot[1] = this.optSlot[1]-1 % 6;
        if(this.optSlot[1] == 5)
            this.optSlot[0]--;
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