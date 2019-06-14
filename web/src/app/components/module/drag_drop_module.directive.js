'use strict';

export function DragModuleDirective() {
	return {
		restrict: 'A',
		scope: {
			moduleObject: '=dragModule',
			moduleModel: '='
		},
		link: function(scope, el) {
			var element = el[0];
			element.draggable = 'draggable';
			element.addEventListener('dragstart', function(e) {
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('panda/moduleId', scope.moduleObject.module.id);
				this.classList.add('drag');
				document.getElementsByClassName('module-container')[0].classList.add('moving_modules');
				return false;
			}, false);

			element.addEventListener('dragend',function() {
                this.classList.remove('drag');
                document.getElementsByClassName('module-container')[0].classList.remove('moving_modules');
                return false;
            }, false);
		}
	};
}

export function DropModuleDirective() {
	return {
		restrict: 'A',
		scope: {
			onDrop: '&'
		},
		link: function(scope, el) {
			var element = el[0];
			element.addEventListener('dragover', function(e) {
				e.dataTransfer.dropEffect = 'move';
				// allows us to drop
				if (e.preventDefault) { e.preventDefault(); }
				this.classList.add('over');
				return false;
			}, false);
			element.addEventListener('dragenter', function() {
		        this.classList.add('over');
		        return false;
		    }, false);
		    element.addEventListener('dragleave', function() {
		        this.classList.remove('over');
		        return false;
		    }, false);
		    element.addEventListener('drop', function(e) {
		    	var moduleId = e.dataTransfer.getData('panda/moduleId');
		    	var i = parseInt(this.getAttribute('module-position-on-page'));
		        scope.onDrop({$toIndex: i, $moduleId: moduleId});
		        return false;
		    }, false);
		}
	};
}
