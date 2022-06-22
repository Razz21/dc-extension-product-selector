import {ProductSelectorError} from '../ProductSelectorError';
import qs from 'qs';

export class BigCommerce {
  constructor({
    storeHash,
    accessToken,
    apiVersion='v3'
  }) {

    this.apiUrl = `/bigcommerce/stores/${storeHash}/${apiVersion}/catalog/products`;
    this.accessToken = accessToken
  }

  getHeaders() {
    return {
      'X-Auth-Token': this.accessToken,
      "Content-Type": "application/json"
    };
  }

  async getItems(state, filterIds = []) {
    const {
      PAGE_SIZE,
    } = state;
    try {
      if (!filterIds.length){
        return [];
      }
      const idsStrings = filterIds.join(',');

      const queryString = qs.stringify(
        {
          include:"primary_image",
          limit: PAGE_SIZE,
          'id:in': idsStrings
        }
      );
      const params = {
        method: 'GET',
        headers: {
          ...this.getHeaders(),
        }
      };

      const response = await fetch(`${this.apiUrl}?${queryString}`, params);
      const {data} = await response.json();

      return this.parseResults(data);

    } catch (e) {
      console.error(e);
      throw new ProductSelectorError('Could not get items', ProductSelectorError.codes.GET_SELECTED_ITEMS);
    }
  }

  getImage({ primary_image = {} }) {
    return primary_image.url_standard || '';
  }

  parseResults(data) {
    return data.map((item) => {
      return {
        id: item.id,
        name: item.name,
        image: this.getImage(item)
      }
    })
  }

  async search(state) {
    const {
      searchText,
      page,
      PAGE_SIZE,
    } = state;

    try {
      const queryString = qs.stringify(
          {
            'keyword:like': searchText,
            include: "primary_image",
            limit: PAGE_SIZE,
            page: page.curPage,
          }
        );
      const params = {
        method: 'GET',
        headers: {
          ...this.getHeaders()
        }
      };

      const response = await fetch(`${this.apiUrl}?${queryString}`, params);

      const { data, meta } = await response.json();
      const total = meta.pagination.total
      return {
        items: this.parseResults(data),
        page: {
          numPages: meta.pagination.total_pages,
          curPage: page.curPage,
          total
        }
      };
    } catch (e) {
      console.error(e);
      throw new ProductSelectorError('Could not search', ProductSelectorError.codes.GET_ITEMS);
    }
  }

  exportItem(item) {
    return String(item.id);
  }
}
