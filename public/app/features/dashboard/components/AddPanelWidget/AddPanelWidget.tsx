import React from 'react';
import _ from 'lodash';
import config from 'app/core/config';
import { PanelModel } from '../../state/PanelModel';
import { DashboardModel } from '../../state/DashboardModel';
import store from 'app/core/store';
import { LS_PANEL_COPY_KEY } from 'app/core/constants';
import { updateLocation } from 'app/core/actions';
import { store as reduxStore } from 'app/store/store';

export interface Props {
  panel: PanelModel;
  dashboard: DashboardModel;
}

export interface State {
  copiedPanelPlugins: any[];
}

type Location = {
  query: {
    panelId: number;
    edit: boolean;
    fullscreen: boolean;
    tab?: string;
    isVizPickerOpen?: boolean;
  };
  partial: boolean;
};

export class AddPanelWidget extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.handleCloseAddPanel = this.handleCloseAddPanel.bind(this);

    this.state = {
      copiedPanelPlugins: this.getCopiedPanelPlugins(),
    };
  }

  getCopiedPanelPlugins() {
    const panels = _.chain(config.panels)
      .filter({ hideFromList: false })
      .map(item => item)
      .value();
    const copiedPanels = [];

    const copiedPanelJson = store.get(LS_PANEL_COPY_KEY);
    if (copiedPanelJson) {
      const copiedPanel = JSON.parse(copiedPanelJson);
      const pluginInfo = _.find(panels, { id: copiedPanel.type });
      if (pluginInfo) {
        const pluginCopy = _.cloneDeep(pluginInfo);
        pluginCopy.name = copiedPanel.title;
        pluginCopy.sort = -1;
        pluginCopy.defaults = copiedPanel;
        copiedPanels.push(pluginCopy);
      }
    }
    return _.sortBy(copiedPanels, 'sort');
  }

  handleCloseAddPanel(evt) {
    evt.preventDefault();
    this.props.dashboard.removePanel(this.props.dashboard.panels[0]);
  }

  copyButton(panel) {
    return (
      <button className="btn-inverse btn" onClick={() => this.onPasteCopiedPanel(panel)} title={panel.name}>
        Paste copied Panel
      </button>
    );
  }

  moveToEdit(location) {
    reduxStore.dispatch(updateLocation(location));
  }

  onCreateNewPanel = (tab = 'queries') => {
    const dashboard = this.props.dashboard;
    const { gridPos } = this.props.panel;

    const newPanel: any = {
      type: 'graph',
      title: 'Panel Title',
      gridPos: { x: gridPos.x, y: gridPos.y, w: gridPos.w, h: gridPos.h },
    };

    dashboard.addPanel(newPanel);
    dashboard.removePanel(this.props.panel);

    let location: Location = {
      query: {
        panelId: newPanel.id,
        edit: true,
        fullscreen: true,
      },
      partial: true,
    };

    if (tab === 'visualization') {
      location = {
        ...location,
        query: {
          ...location.query,
          tab: 'visualization',
          isVizPickerOpen: true,
        },
      };
      this.moveToEdit(location);
    } else {
      this.moveToEdit(location);
    }
  };

  onPasteCopiedPanel = panelPluginInfo => {
    const dashboard = this.props.dashboard;
    const { gridPos } = this.props.panel;

    const newPanel: any = {
      type: panelPluginInfo.id,
      title: 'Panel Title',
      gridPos: { x: gridPos.x, y: gridPos.y, w: gridPos.w, h: gridPos.h },
    };

    // apply panel template / defaults
    if (panelPluginInfo.defaults) {
      _.defaults(newPanel, panelPluginInfo.defaults);
      newPanel.title = panelPluginInfo.defaults.title;
      store.delete(LS_PANEL_COPY_KEY);
    }

    dashboard.addPanel(newPanel);
    dashboard.removePanel(this.props.panel);
  };

  onCreateNewRow = () => {
    const dashboard = this.props.dashboard;

    const newRow: any = {
      type: 'row',
      title: 'Row title',
      gridPos: { x: 0, y: 0 },
    };

    dashboard.addPanel(newRow);
    dashboard.removePanel(this.props.panel);
  };

  renderOptionLink = (icon, text, onClick) => {
    return (
      <div>
        <a href="#" onClick={onClick} className="add-panel-widget__link btn-inverse">
          <div className="add-panel-widget__icon">
            <i className={`gicon gicon-${icon}`} />
          </div>
          <span>{text}</span>
        </a>
      </div>
    );
  };

  render() {
    return (
      <div className="panel-container add-panel-widget-container">
        <div className="add-panel-widget">
          <div className="add-panel-widget__header grid-drag-handle">
            <i className="gicon gicon-add-panel" />
            <button className="add-panel-widget__close" onClick={this.handleCloseAddPanel}>
              <i className="fa fa-close" />
            </button>
          </div>
          <div className="add-panel-widget__btn-container">
            {this.renderOptionLink('queries', 'Add query', this.onCreateNewPanel)}
            {this.renderOptionLink('visualization', 'Choose Panel type', () => this.onCreateNewPanel('visualization'))}
            {this.renderOptionLink('queries', 'Convert to row', this.onCreateNewRow)}
          </div>
        </div>
      </div>
    );
  }
}
