var app = new Vue({
    el: '#app',
    data: {
        graphicCards: [],
        comparisonCards: [],
        searchModel: "",
        showComparison: false,
        showSearchBar: true,
        img_url:"",
        description:"",
        currentPage:1,
        pageSize:5,
        totalPages: 0,
        totNumItems: 0,
        model:"",
        brand:"",
        comparisonCurrentPage: 1,
        comparisonPageSize: 5,
        comparisonTotalPages: 0,
        comparisonTotNumItems: 0,
        currentGraphicCardId: null
    },
    methods : {
        loadAllGraphicCards: function (){
            var localApp = this;
            this.showSearchBar = false;
            var url = 'http://localhost:8080/graphic_cards/search_model/' + this.searchModel;
            url += '?page=' + this.currentPage + '&pageSize=' + this.pageSize;
            axios.get(url)
                .then(function (response) {
                    localApp.graphicCards = response.data.graphicCards;
                    localApp.totalPages = Math.ceil(response.data.totNumItems / localApp.pageSize);
                    this.showSearchBar = false;
                    console.log(response.data.totNumItems);
                    console.log(url);
                })
                .catch(function (error) {
                    console.log(error);
                });
         },

         loadComparison: function (id = this.currentGraphicCardId, img_url, description, model, brand){
            var localApp = this;
            this.showSearchBar = false;
            localApp.currentGraphicCardId = id;
            var url = 'http://localhost:8080/graphic_cards/' + id;
            url += '?page=' + this.comparisonCurrentPage  + '&pageSize=' + this.comparisonPageSize;

            axios.get(url)
                .then(function (response) {
                    console.log(response.data.totNumItems);
                    console.log(localApp.comparisonPageSize);
                    localApp.comparisonTotalPages  = Math.ceil(response.data.totNumItems / localApp.comparisonPageSize);
                    console.log(localApp.comparisonTotalPages);
                    localApp.comparisonCards = response.data.comparison;
                    localApp.showComparison = true;
                    if (img_url && description && model) {
                        localApp.img_url = img_url;
                        localApp.description = description;
                        localApp.model = model;
                        localApp.brand = brand;
                    }
                    console.log(url)
                })
                .catch(function (error) {
                    console.log(error);
                });
        },
        getBaseDomain(url) {
            const parsedURL = new URL(url);
            return parsedURL.hostname;
        },
         redirectToCardUrl: function(url) {
            window.open(url, '_blank');
        },
         prevPage: function() {
           if (this.currentPage > 1) {
                this.currentPage--;
                this.loadAllGraphicCards();
            }
         },
         nextPage: function() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadAllGraphicCards();
            }
         },
         goToPage: function(page) {
            this.currentPage = page;
            this.loadAllGraphicCards();
         },
         comparisonPrevPage: function() {
            if (this.comparisonCurrentPage > 1) {
                this.comparisonCurrentPage--;
                this.loadComparison();
            }
        },

        comparisonNextPage: function() {
            if (this.comparisonCurrentPage < this.comparisonTotalPages) {
                this.comparisonCurrentPage++;
                this.loadComparison();
            }
        },
        comparisonGoToPage: function(page) {
            this.comparisonCurrentPage = page;
            this.loadComparison();
        },
        resetView: function() {
            this.showComparison = false;
            this.showSearchBar = true;
            this.searchModel = "";
            this.graphicCards = [];
            this.comparisonCards = [];
            this.currentPage = 1;
            this.totalPages = 0;
            this.totNumItems = 0;

            // Reset pagination for comparison list
            this.comparisonCurrentPage = 1;
            this.comparisonTotalPages = 0;
            this.comparisonTotNumItems = 0;
        },
        backToResults: function() {
            this.showComparison = false;
            this.comparisonCurrentPage = 1; 
        }
    },
})