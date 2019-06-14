'use strict';

class NewPageCtrl {
    constructor($scope, DataCache, Collection, Page) {
        this.cache = DataCache;
        this.Collection = Collection;
        this.Page = Page;
        this.$scope = $scope;
        this.newPageSettings = {};

        $scope.$on('ngDialog.opened', () => {
            this.onOpen();
        });
    }
    possibleCategories() {
        return Object.keys(this.cache.categories)
            .filter( catId => this.cache.current_user.canCreatePage(catId) )
            .map( catId => this.cache.categories[catId] );
    }
    onOpen() {
        var categoryId;
        if (this.$scope.currentCategory) {
            categoryId = this.$scope.currentCategory.id;
        } else {
            categoryId = Object.keys(this.cache.categories)[0];
        }
        this.newPageSettings = {
            title: '',
            category_id: categoryId,
            author: [{
                author_type: 'panda',
                author_id: this.cache.current_user.id
            }]
        };
    }
    submitCreateForm() {
        if (this.cache.categories[this.newPageSettings.category_id].navigation.length > 0) {
            this.newPageSettings.subcategory_id = this.cache.categories[this.newPageSettings.category_id].navigation[0].id;
        }
        if (this.cache.categories[this.newPageSettings.category_id].config.pageType === 'collectionPage') {
        	new this.Collection(this.newPageSettings).save().then((collection) => {
        		this.cache.collections[collection.id] = collection;
        		this.cache.current_user.edit_mode = true;
        		this.$scope.open('/collection/' + collection.id);
        	});
        } else {
        	new this.Page(this.newPageSettings).save().then((page) => {
        		this.cache.pages[page.id] = page;
        		this.cache.current_user.edit_mode = true;
        		this.$scope.open('/page/' + page.id);
        	});
        }
        this.$scope.closeThisDialog();
    }
}

NewPageCtrl.$inject = ['$scope', 'DataCache', 'Collection', 'Page'];

export default NewPageCtrl;
