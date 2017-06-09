angular.module("yggdrasil")

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

//filtro para matérias já feitas
.filter('doneSkills', function (skillService) {

    return function (array, type) {

        var out = [];

        //buscar em todas as materias
        angular.forEach(array, function(status, code) {

            //se está feita, vamos saber mais
            if(status == 'done') {

                var skill = skillService.fetchSkill(code);
                if(!skill) return;

                //para livres, pode ser tipo 2 ou convertida
                if(type == 2 && (skill.type == 2 || skill.isFree))
                    out.push(skill);
                //para eletivas, tem que ser tipo 1 e não convertida
                else if(type == 1 && skill.type == 1 && !skill.isFree)
                    out.push(skill);
                //para obrigatorias é normal
                else if(type == 0 && skill.type == 0)
                    out.push(skill);
            }

        });
        return out;
    }
})