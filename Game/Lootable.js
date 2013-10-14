/*
    This file is part of Ironbane MMO.

    Ironbane MMO is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Ironbane MMO is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Ironbane MMO.  If not, see <http://www.gnu.org/licenses/>.
*/

var Lootable = Unit.extend({
    lifeTime: 0,
    Init: function(data, loadItems) {
        this._super(data);

        // HACKY HACKY!!! See NPC
        // Set to the default template values
        if (_.isUndefined(this.param)) {
          this.param = this.template.param;
        }
        // END HACKY


        this.loot = [];

        if (loadItems) {
            if (this.param < 10) {
                this.loadItems();
            } else {
                this.Restock();
            }
        }
    },
    loadItems: function() {
        var self = this;
        // ok to be changing references here?
        Item.getAllForOwner(self.id).then(function(items) {
            self.loot = items;
        }, function(err) {
            log('Error getting items for Lootable: ' + self.id);
            self.loot = [];
        });
    },
    Awake: function() {
        this._super();
    },
    Restock: function() {
        //    log("Restocking...");
        var unit = this;
        unit.loot = [];

        // Load loot from metadata (with percentages!)
        if (!_.isEmpty(unit.data.loot)) {
            var lootSplit = unit.data.loot.split(";");
            for (var l = 0; l < lootSplit.length; l++) {
                var templateId = null;
                var chanceSplit = lootSplit[l].split(":");

                if (WasLucky100(parseInt(chanceSplit[0], 10))) {
                    templateId = parseInt(chanceSplit[1], 10);
                }

                if (templateId) {
                    ItemTemplate.get(templateId).then(function(template) {
                        unit.loot.push(new Item(template, {slot: 1}));
                    }, function(err) {
                        log("Warning! item " + templateId + " not found for Lootable " + unit.id + "!");
                    });
                }
            }
        }
    },
    Tick: function(dTime) {
        this.lifeTime += dTime;

        // Lootbags (<10) are removed while lootable meshes restock
        if (this.param < 10) {
            if (this.lifeTime > 30) {
                this.Remove();
            }
        } else {
            if (this.lifeTime > this.data.respawnTime) {
                //... restock :)
                this.Restock();
                this.lifeTime = 0;
            }
        }
        this._super(dTime);
    }
});